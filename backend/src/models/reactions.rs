use mongodb::bson::doc;
use mongodb::{Client, Collection};
use serde::{Deserialize, Serialize};
use mongodb::error::Result as MongoResult;
use deadpool_redis::redis::AsyncCommands;
use deadpool_redis::Connection;
use futures::stream::{StreamExt, TryStreamExt};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReactionRole {
    #[serde(rename = "guildId")]
    guild_id: String,
    #[serde(rename = "channelId")]
    channel_id: String,
    #[serde(rename = "messageId")]
    message_id: String,
    #[serde(rename = "roleId")]
    role_id: String,
    emoji: String,
}

impl ReactionRole {
    // Get all reaction roles from MongoDB for a specific guild
    pub async fn find_all_by_guild_id(client: &Client, redis_conn: &mut Connection, guild_id: &str) -> MongoResult<Vec<Self>> {
        let key = format!("reaction_roles:{}", guild_id);
        let cached: Result<Option<String>, _> = redis_conn.get(&key).await;

        if let Ok(Some(json)) = cached {
            if let Ok(reaction_roles) = serde_json::from_str(&json) {
                tracing::event!(target: "backend", tracing::Level::DEBUG, "All guild reaction roles found in Redis.");
                tracing::event!(target: "backend", tracing::Level::DEBUG, "{:?}", reaction_roles);
                return Ok(reaction_roles);
            }
        }

        // Read database from Settings struct
        let settings = crate::settings::get_settings().expect("Cannot load settings.");
        let database = settings.mongo.get_database();

        let collection: Collection<Self> = client.database(&database).collection("reaction-roles");
        let filter = doc! { "guildId": guild_id };
        let mut cursor = match collection.find(filter, None).await {
            Ok(cursor) => cursor,
            Err(_) => {
                tracing::event!(target: "backend", tracing::Level::DEBUG, "Reaction roles not found in MongoDB.");
                // Return 404 if not found
                return Ok(Vec::new());
            }
        };

        let mut reaction_roles: Vec<Self> = Vec::new();
        while let Some(result) = cursor.next().await {
            if let Ok(reaction_role) = result {
                reaction_roles.push(reaction_role);
            }
        }

        // Cache in Redis using cache_in_redis
        if let Err(e) = crate::utils::cache_in_redis(&key, &reaction_roles, redis_conn, 84600).await {
            tracing::error!("Failed to cache reaction roles in Redis: {:?}", e);
        }

        tracing::event!(target: "backend", tracing::Level::DEBUG, "Reaction roles found in MongoDB {:?}.", reaction_roles);
        Ok(reaction_roles)
      }

    pub async fn find_by_guild_id_and_message_id_and_emoji(client: &Client, redis_conn: &mut Connection, guild_id: &str, message_id: &str, emoji: &str) -> MongoResult<Option<Self>> {
        let key = format!("reaction_roles:{}", guild_id);
        let cached: Result<Option<String>, _> = redis_conn.get(&key).await;

        if let Ok(Some(json)) = cached {
            if let Ok(reaction_roles) = serde_json::from_str::<Vec<Self>>(&json) {
                tracing::event!(target: "backend", tracing::Level::DEBUG, "Reaction roles found in Redis.");
                tracing::event!(target: "backend", tracing::Level::DEBUG, "{:?}", reaction_roles);
                let reaction_role = reaction_roles.into_iter().find(|reaction_role| reaction_role.message_id == message_id && reaction_role.emoji.trim() == emoji);

                tracing::event!(target: "backend", tracing::Level::DEBUG, "Parsed reaction role: {:?}.", reaction_role);
                return Ok(reaction_role);
            }
        }
        
        match Self::find_all_by_guild_id(client, redis_conn, guild_id).await {
            Ok(reaction_roles) => {
                let reaction_role = reaction_roles.into_iter().find(|reaction_role| reaction_role.message_id == message_id && reaction_role.emoji.trim() == emoji);
                let role_key = format!("reaction_roles_for_guild:{}:{}:{}", guild_id, message_id, emoji);

                if let Some(reaction_role) = reaction_role {
                    if let Err(e) = crate::utils::cache_in_redis(&role_key, &reaction_role, redis_conn, 84600).await {
                        tracing::error!("Failed to cache reaction role in Redis: {:?}", e);
                    }
                    return Ok(Some(reaction_role));
                } else {
                    return Ok(None);
                }
            },
            Err(_) => {
                tracing::event!(target: "backend", tracing::Level::DEBUG, "Reaction roles not found in MongoDB.");
                return Ok(None);
            }
        }
    }
}