use deadpool_redis::redis::cmd;
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
struct Payload {
    games: Vec<Game>,
}

#[derive(Serialize, Deserialize, Debug)]
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

#[tracing::instrument(name = "Fetching all playbite games",
skip( redis_pool))]
#[actix_web::get("")]
pub async fn get_all_games(
    redis_pool: actix_web::web::Data<deadpool_redis::Pool>,
) -> actix_web::HttpResponse {
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Accessing games endpoint.");
    let mut connection = redis_pool
    .get()
    .await
    .map_err(|e| {
        tracing::event!(target: "backend", tracing::Level::ERROR, "{}", e);
        actix_web::HttpResponse::InternalServerError().json("We cannot process this request at the current time.")
    })
    .expect("Redis connection cannot be gotten.");

    let games: Option<Payload> = cmd("GET")
      .arg("all_games")
      .query_async::<_, Option<String>>(&mut connection)
      .await
      .map_err(|e| {
        tracing::event!(target: "backend", tracing::Level::ERROR, "{}", e);
        actix_web::HttpResponse::InternalServerError().json("We cannot process this request at the current time.")
      })
      .expect("Cannot get games from Redis.")
      .map(|games| serde_json::from_str(&games).expect("Cannot parse games from Redis."));
    
      tracing::event!(target: "backend", tracing::Level::DEBUG, "Past fetch games from reddis.");

    if let Some(games) = games {
        tracing::event!(target: "backend", tracing::Level::DEBUG, "Found games in Redis.");
        return actix_web::HttpResponse::Ok().json(games);
    }

    let url = "https://playbiteapi.azurewebsites.net/api/feed?plat=web";
    match reqwest::get(url).await {
      Ok(response) => match response.json::<Vec<Item>>().await {
          Ok(items) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Received games from API call.");
              // Filter out the part where the title is "All Games"
              let all_games_payload = items.into_iter()
                  .find(|item| item.title == "All Games")
                  .map(|item| item.payload);

              tracing::event!(target: "backend", tracing::Level::DEBUG, "Filtered out and grabbed 'All Games'.");

              match all_games_payload {
                  Some(payload) => {
                      let response = serde_json::to_string(&payload).map_err(|error| {
                          tracing::error!("Failed to serialize Playbite response: {:?}", error);
                          actix_web::HttpResponse::InternalServerError().json("We cannot process this request at the current time.")
                      }).expect("Cannot serialize Playbite response.");

                      cmd("SET")
                      .arg("all_games")
                      .arg(&response)
                      .query_async::<_, ()>(&mut connection)
                      .await
                      .map_err(|e| {
                          tracing::event!(target: "backend", tracing::Level::ERROR, "Failed to set Redis data {}", e);
                          actix_web::HttpResponse::InternalServerError().json("We cannot process this request at the current time.")
                      })
                      .expect("Cannot set games in Redis.");

                      let games: Payload = serde_json::from_str(&response).expect("Cannot parse games from Playbite.");

                      return actix_web::HttpResponse::Ok().json(games)
                  },
                  None => {
                      tracing::error!("Failed to find All Games payload in Playbite response");
                      return actix_web::HttpResponse::InternalServerError().json("We cannot process this request at the current time.");
                  },
              }
          },
          Err(e) => {
              tracing::error!("Failed to parse Playbite response: {:?}", e);
              return actix_web::HttpResponse::InternalServerError().json("We cannot process this request at the current time.");
          },
      },
      Err(e) => {
        tracing::error!("Failed to parse Playbite response: {:?}", e);
        return actix_web::HttpResponse::InternalServerError().json("We cannot process this request at the current time.");
      },
  }

}