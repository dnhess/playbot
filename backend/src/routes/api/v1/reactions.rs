use crate::models::reactions::ReactionRole;
use actix_web::{web, HttpResponse};

#[tracing::instrument(name = "Fetching reaction role", skip(redis_pool, mongo_client))]
#[actix_web::get("/{message_id}/emoji/{emoji}")]
pub async fn get_reaction(
    path: web::Path<(String, String, String)>,
    redis_pool: web::Data<deadpool_redis::Pool>,
    mongo_client: web::Data<mongodb::Client>,
) -> HttpResponse {
    tracing::event!(target: "backend", tracing::Level::INFO, "Accessing reaction role endpoint.");

    let (guild_id, message_id, emoji) = path.into_inner();

    let mut connection = match redis_pool.get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("{}", e);
            return HttpResponse::InternalServerError()
                .json("We cannot process this request at the current time.");
        }
    };

    // Use ReactionRole::find_by_guild_id_and_message_id_and_emoji to fetch the reaction role from MongoDB
    match ReactionRole::find_by_guild_id_and_message_id_and_emoji(
        &mongo_client,
        &mut connection,
        &guild_id,
        &message_id,
        &emoji,
    )
    .await
    {
        Ok(reaction_role) => {
            // If result is None, return a 404
            if let None = reaction_role {
                return HttpResponse::NotFound().json("Reaction role not found.");
            }

            // If result is Ok, return the reaction role
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Reaction role found in MongoDB.");
            HttpResponse::Ok().json(reaction_role.unwrap())
        }
        Err(_) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Reaction role not found in MongoDB.");

            // If not found, return a 404
            HttpResponse::NotFound().json("Reaction role not found.")
        }
    }
}
