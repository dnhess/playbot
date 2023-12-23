use serde::{Deserialize, Serialize};
use actix_web::{web, HttpResponse};
use crate::{utils::{cache_in_redis, fetch_from_redis}, routes::api::v1::games::Game, routes::api::v1::games::fetch_games};
use futures::future::join_all;

#[derive(Deserialize, Serialize, Debug)]
pub struct Ranking {
    pub position: u32,
    pub name: String,
    pub points: u32,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct GameResponse {
    game: Game,
    rankings: Vec<Ranking>,
}

// If the API returns an array of rankings
type Rankings = Vec<Ranking>;

#[tracing::instrument(name = "Fetching playbite game", skip(redis_pool))]
#[actix_web::get("/{name}")]
pub async fn get_game(
  name: web::Path<String>,
  redis_pool: web::Data<deadpool_redis::Pool>,
) -> HttpResponse {
    tracing::event!(target: "backend", tracing::Level::DEBUG, "Accessing game endpoint.");

    let mut connection = match redis_pool.get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("{}", e);
            return HttpResponse::InternalServerError().json("We cannot process this request at the current time.");
        }
    };

    let game_name = name.into_inner();

    match fetch_from_redis::<GameResponse>(&format!("game:{}", game_name), &mut connection).await {
        Ok(game) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Game found in Redis.");
            HttpResponse::Ok().json(game)
        },
        Err(_) => {
            tracing::event!(target: "backend", tracing::Level::DEBUG, "Game not found in Redis.");
            match fetch_games(&redis_pool).await {
                Ok(games) => {
                    tracing::event!(target: "backend", tracing::Level::DEBUG, "Found all games from API");
                    let all_games = games.games;
                    match all_games.iter().find(|&game| game.name.as_ref() == Some(&game_name)) {
                        Some(found_game) => {
                            match fetch_rankings(&found_game.id).await {
                                Ok(rankings) => {
                                    // Build the response
                                    let game_response = GameResponse {
                                        game: found_game.clone(),
                                        rankings,
                                    };
                                    if let Err(e) = cache_in_redis::<GameResponse>(&format!("game:{}", game_name), &game_response, &mut connection).await {
                                        tracing::error!("Failed to cache game in Redis: {:?}", e);
                                    }
                                    HttpResponse::Ok().json(game_response)
                                },
                                Err(e) => {
                                  tracing::error!("Failed to fetch rankings from API: {:?}", e);
                                  HttpResponse::InternalServerError().json("Failed to fetch rankings")
                                }
                            }
                        },
                        None => HttpResponse::NotFound().json("Game not found")
                    }
                },
                Err(e) => {
                  tracing::error!("Failed to fetch games from API: {:?}", e);
                  HttpResponse::InternalServerError().json("Failed to fetch games")
                }
            }
        }
    }
}

async fn fetch_rankings(game_id: &str) -> Result<Vec<Ranking>, reqwest::Error> {
  let base_url = "https://playbiteapi.azurewebsites.net/api/games/";
  let urls = vec![
      format!("{}{}/rankings?type=all", base_url, game_id),
      format!("{}{}/rankings?type=day", base_url, game_id),
      format!("{}{}/rankings?type=week", base_url, game_id),
  ];

  let futures = urls.into_iter().map(|url| {
      fetch_ranking(url)
  });

  let results = join_all(futures).await;

  // Create an empty vector to hold all rankings
  let mut all_rankings: Vec<Ranking> = Vec::new();

  // Iterate over each result and extend all_rankings with the contents
  for ranking_result in results {
      if let Ok(rankings) = ranking_result {
          all_rankings.extend(rankings);
      }
  }

  Ok(all_rankings)
}



async fn fetch_ranking(url: String) -> Result<Vec<Ranking>, reqwest::Error> {
  let response = reqwest::get(&url).await?.json::<Vec<Ranking>>().await?;
  Ok(response)
}


