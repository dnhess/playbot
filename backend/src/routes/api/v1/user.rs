use std::fmt;

use serde::{Deserialize, Serialize, Deserializer, de::{Visitor, self}};
use actix_web::{web, HttpResponse};
use crate::utils::{cache_in_redis, fetch_from_redis};

#[derive(Deserialize, Serialize, Debug)]
struct User {
  id: String,
  #[serde(rename = "displayName")]
  display_name: String,
  #[serde(rename = "imageUrl")]
  image_url: String,
  bio: String,
  stats: Vec<Stats>,
}

#[derive(Deserialize, Serialize, Debug)]
struct Stats {
  icon: String,
  #[serde(deserialize_with = "deserialize_string_or_number")]
  value: String,
  description: String,
}

fn deserialize_string_or_number<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    struct StringOrNumberVisitor;

    impl<'de> Visitor<'de> for StringOrNumberVisitor {
        type Value = String;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("string or number")
        }

        fn visit_str<E>(self, v: &str) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(v.to_owned())
        }

        fn visit_i64<E>(self, v: i64) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(v.to_string())
        }

        fn visit_u64<E>(self, v: u64) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(v.to_string())
        }

        fn visit_f64<E>(self, v: f64) -> Result<String, E>
        where
            E: de::Error,
        {
            Ok(v.to_string())
        }
    }

    deserializer.deserialize_any(StringOrNumberVisitor)
}



#[tracing::instrument(name = "Fetching playbite user", skip(redis_pool))]
#[actix_web::get("/{name}")]
pub async fn get_user(
  name: web::Path<String>,
  redis_pool: web::Data<deadpool_redis::Pool>,
) -> HttpResponse {
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Accessing user endpoint.");

    let mut connection = match redis_pool.get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("{}", e);
            return HttpResponse::InternalServerError().json("We cannot process this request at the current time.");
        }
    };

    let user_name = name.into_inner();

    match fetch_from_redis::<User>(&format!("user:{}", user_name), &mut connection).await {
        Ok(game) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "User found in Redis.");
            HttpResponse::Ok().json(game)
        },
        Err(_) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "User not found in Redis.");

              match fetch_user(&user_name).await {
                  Ok(user) => {
                      if let Err(e) = cache_in_redis::<User>(&format!("user:{}", user_name), &user, &mut connection).await {
                          tracing::error!("Failed to cache game in Redis: {:?}", e);
                      }
                      HttpResponse::Ok().json(user)
                  },
                  Err(e) => {
                    tracing::error!("Failed to fetch user from API: {:?}", e);
                    HttpResponse::InternalServerError().json("Failed to fetch user from Playbite API.")
                  }
              }
      }
  }
}

async fn fetch_user(user_name: &str) -> Result<User, String> {
  let base_url = "https://playbiteapi.azurewebsites.net/api/users/";

  let url = format!("{}{}/stats", base_url, user_name);

  match reqwest::get(&url).await {
      Ok(res) => match res.json::<User>().await {
          Ok(data) => Ok(data),
          Err(err) => Err(format!("Failed to parse Playbite response: {:?}", err)),
      }
      Err(err) => Err(format!("Failed to make request to API: {:?}", err)),
  }

}


