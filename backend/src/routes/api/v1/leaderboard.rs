use actix_web::{web, HttpResponse};
use crate::models::levels::Level;

#[tracing::instrument(name = "Fetching user from levels", skip(redis_pool, mongo_client))]
#[actix_web::get("")]
pub async fn get_user_rank(
    path: web::Path<(String, String)>,
    redis_pool: web::Data<deadpool_redis::Pool>,
    mongo_client: web::Data<mongodb::Client>,
) -> HttpResponse {
    tracing::event!(target: "backend", tracing::Level::INFO, "Accessing user endpoint.");
    
    let (guild_id, user_id) = path.into_inner();

    let mut connection = match redis_pool.get().await {
      Ok(conn) => conn,
      Err(e) => {
          tracing::error!("{}", e);
          return HttpResponse::InternalServerError().json("We cannot process this request at the current time.");
      }
    };

    // Use Level::find_by_guild_id_and_user_id to fetch the level from MongoDB
    match Level::find_by_guild_id_and_user_id(&mongo_client, &mut connection, &mut &guild_id, &user_id).await {
        Ok(level) => {
            // If result is None, return a 404
            if let None = level {
                return HttpResponse::NotFound().json("Level not found.");
            }

            // If result is Ok, return the level
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Level found in MongoDB.");
            HttpResponse::Ok().json(level.unwrap())
        },
        Err(_) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Level not found in MongoDB.");

            // If not found, return a 404
            HttpResponse::NotFound().json("Level not found.")
        }
    }
}

#[tracing::instrument(name = "Fetching top users from levels", skip(redis_pool, mongo_client))]
#[actix_web::get("")]
pub async fn get_top_users(
    path: web::Path<String>,
    redis_pool: web::Data<deadpool_redis::Pool>,
    mongo_client: web::Data<mongodb::Client>,
) -> HttpResponse {
    tracing::event!(target: "backend", tracing::Level::INFO, "Accessing top users endpoint.");
    
    let guild_id = path.into_inner();

    let mut connection = match redis_pool.get().await {
      Ok(conn) => conn,
      Err(e) => {
          tracing::error!("{}", e);
          return HttpResponse::InternalServerError().json("We cannot process this request at the current time.");
      }
    };

    // Use Level::find_top_users_by_guild to fetch the top users from MongoDB
    match Level::find_top_users_by_guild(&mut connection, &mongo_client, &guild_id, 10).await {
        Ok(levels) => {
            // If result is None, return a 404
            if levels.len() == 0 {
                return HttpResponse::NotFound().json("Levels not found.");
            }

            // If result is Ok, return the levels
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Levels found in MongoDB.");
            HttpResponse::Ok().json(levels)
        },
        Err(_) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Levels not found in MongoDB.");

            // If not found, return a 404
            HttpResponse::NotFound().json("Levels not found.")
        }
    }
}