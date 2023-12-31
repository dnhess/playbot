use serde::{Deserialize, Serialize};
use mongodb::bson::doc;
use mongodb::{Client, Collection, options::FindOptions};
use mongodb::error::Result as MongoResult;
use deadpool_redis::redis::AsyncCommands;
use deadpool_redis::Connection;
use mongodb::bson::DateTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct Level {
    #[serde(rename = "guildId")]
    guild_id: String,
    #[serde(rename = "userId")]
    user_id: String,
    #[serde(rename = "XP")]
    xp: i32,
    level: i32,
    #[serde(rename = "totalXP")]
    total_xp: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "updatedAt")]
    updated_at: Option<DateTime>
}

impl Level {
    pub async fn find_by_guild_id_and_user_id(client: &Client, redis_conn: &mut Connection, guild_id: &str, user_id: &str) -> MongoResult<Option<Self>> {
        let key = format!("level:{}:{}", guild_id, user_id);
        let cached: Result<Option<String>, _> = redis_conn.get(&key).await;

        if let Ok(Some(json)) = cached {
            if let Ok(level) = serde_json::from_str(&json) {
                tracing::event!(target: "backend", tracing::Level::DEBUG, "Level found in Redis.");
                return Ok(Some(level));
            }
        }

        // Read database from Settings struct
        let settings = crate::settings::get_settings().expect("Cannot load settings.");
        let database = settings.mongo.get_database();

        let collection: Collection<Self> = client.database(&database).collection("levels");
        let filter = doc! { "guildId": guild_id, "userId": user_id };
        let result = collection.find_one(filter, None).await;

        tracing::event!(target: "backend", tracing::Level::DEBUG, "Result from MongoDB: {:?}.", result);

        // If result is none, return a 404
        if let Ok(None) = result {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Level not found in MongoDB.");
            return Ok(None);
        }

        // If result is Ok, cache it in Redis, using utils cache_in_redis
        if let Ok(Some(ref level)) = result {
            if let Err(e) = crate::utils::cache_in_redis::<Self>(&key, &level, redis_conn, 300).await {
                tracing::error!("Failed to cache level in Redis: {:?}", e);
            }
        }

        result
    }

    pub async fn find_top_users_by_guild(redis_conn: &mut Connection, client: &Client, guild_id: &str, limit: i64) -> MongoResult<Vec<Self>> {
      let settings = crate::settings::get_settings().expect("Cannot load settings.");
      let database = settings.mongo.get_database();
      let key = format!("leaderboard:{}", guild_id);

      let cached: Result<Option<String>, _> = redis_conn.get(&key).await;

      if let Ok(Some(json)) = cached {
          if let Ok(leaderboard) = serde_json::from_str(&json) {
              tracing::event!(target: "backend", tracing::Level::DEBUG, "Leaderboard found in Redis.");
              return Ok(leaderboard);
          }
      }
  
      let collection: Collection<Self> = client.database(&database).collection("levels");
      let filter = doc! { "guildId": guild_id };
      let options = FindOptions::builder().sort(doc! { "totalXP": -1, "level": -1 }).limit(limit).build();
      let cursor = collection.find(filter, options).await.ok().expect("Failed to execute find.");
      let serial: Vec<Self> = match futures::TryStreamExt::try_collect(cursor).await {
          Ok(serial) => {
              if let Err(e) = crate::utils::cache_in_redis::<Vec<Self>>(&key, &serial, redis_conn, 3600).await {
                  tracing::error!("Failed to cache leaderboard in Redis: {:?}", e);
              }
              serial
          },
          Err(e) => {
              tracing::error!("Failed to serialize cursor: {:?}", e);
              return Err(e);
          }
      };

      Ok(serial)
    }
}