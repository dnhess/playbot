use crate::utils::{cache_in_redis, fetch_from_redis};
use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct ApiResponse {
    items: Vec<Item>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Item {
    title: String,
    #[serde(rename = "type")]
    item_type: String,
    payload: Payload,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Payload {
    pub games: Vec<Game>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Game {
    pub id: String,
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub game_type: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "posterImageUrl")]
    pub poster_image_url: Option<String>,
    #[serde(rename = "iconImageUrl")]
    pub icon_image_url: Option<String>,
    #[serde(rename = "appUrl")]
    pub app_url: Option<String>,
    #[serde(rename = "promoImageUrl")]
    pub promo_image_url: Option<String>,
}

#[tracing::instrument(name = "Fetching all playbite games", skip(redis_pool))]
#[actix_web::get("")]
pub async fn get_all_games(redis_pool: actix_web::web::Data<deadpool_redis::Pool>) -> HttpResponse {
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Accessing games endpoint.");

    match fetch_games(&redis_pool).await {
        Ok(games) => HttpResponse::Ok().json(games),
        Err(response) => response,
    }
}

async fn fetch_games_from_api() -> Result<Payload, String> {
    let url = "https://playbiteapi.azurewebsites.net/api/games";
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Starging request to API: {:?}", url);

    let response = match reqwest::get(url).await {
        Ok(res) => res,
        Err(err) => return Err(format!("Failed to make request to API: {:?}", err)),
    };
    let status = response.status();
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Response status from API: {:?}", status);
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Response from API: {:?}", response);

    // Filter games where game_type is "App"
    let games: Vec<Game> = match response.json().await {
        Ok(games) => games,
        Err(err) => return Err(format!("Failed to parse response from API: {:?}", err)),
    };
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Games found in API: {:?}", games);

    let filtered_games: Vec<Game> = games
        .into_iter()
        .filter(|game| game.game_type.as_deref() == Some("App"))
        .collect();

    Ok(Payload {
        games: filtered_games,
    })
}

pub(crate) async fn fetch_games(
    redis_pool: &web::Data<deadpool_redis::Pool>,
) -> Result<Payload, HttpResponse> {
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Setting up redis connection.");
    let mut connection = match redis_pool.get().await {
        Ok(conn) => conn,
        Err(_) => return Err(HttpResponse::InternalServerError().json("Redis connection error")),
    };

    tracing::event!(target: "backend", tracing::Level::DEBUG, "Fetching games from Redis.");

    match fetch_from_redis::<Payload>("all_games", &mut connection).await {
        Ok(games) => Ok(games),
        Err(_) => match fetch_games_from_api().await {
            Ok(games) => {
                if let Err(e) = cache_in_redis("all_games", &games, &mut connection, 3600).await {
                    tracing::error!("Failed to cache games in Redis: {:?}", e);
                }
                Ok(games)
            }
            Err(_) => Err(HttpResponse::InternalServerError().json("API fetch error")),
        },
    }
}
