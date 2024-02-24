use crate::utils::{cache_in_redis, fetch_from_redis};
use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

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
    pub title: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "posterImageUrl")]
    pub poster_image_url: Option<String>,
    #[serde(rename = "iconImageUrl")]
    pub icon_image_url: Option<String>,
    #[serde(rename = "appUrl")]
    pub app_url: Option<String>,
    #[serde(rename = "promoImageUrl")]
    pub promo_image_url: Option<String>,
    #[serde(rename = "helpUrl")]
    pub help_url: Option<String>,
    #[serde(rename = "forceRemoteDistribution")]
    pub force_remote_distribution: Option<bool>,
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
    let url = "https://playbiteapi.azurewebsites.net/api/feed?plat=web";
    let response = match reqwest::get(url).await {
        Ok(res) => res,
        Err(err) => return Err(format!("Failed to make request to API: {:?}", err)),
    };

    let items: Vec<Item> = match response.json::<Vec<Item>>().await {
        Ok(data) => data,
        Err(err) => return Err(format!("Failed to parse Playbite response: {:?}", err)),
    };

    let mut all_games = Vec::new();
    let mut latest_releases = Vec::new();
    let mut unique_ids = HashSet::new();

    for item in items {
        match item.title.as_str() {
            "All Games" => all_games = item.payload.games,
            "Latest Releases" => latest_releases = item.payload.games,
            _ => {}
        }
    }

    // Combine all_games and latest_releases into one Vec<Game>, removing duplicates
    let mut combined_games = Vec::new();
    for game in all_games.into_iter().chain(latest_releases.into_iter()) {
        if unique_ids.insert(game.id.clone()) {
            combined_games.push(game);
        }
    }

    Ok(Payload {
        games: combined_games,
    })
}

pub(crate) async fn fetch_games(
    redis_pool: &web::Data<deadpool_redis::Pool>,
) -> Result<Payload, HttpResponse> {
    let mut connection = match redis_pool.get().await {
        Ok(conn) => conn,
        Err(_) => return Err(HttpResponse::InternalServerError().json("Redis connection error")),
    };

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
