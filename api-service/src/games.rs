use rocket::serde::{Serialize,  Deserialize, json::Json};
use rocket::http::Status;
use rocket::response::status;

// Make a requesst to playbite, https://playbiteapi.azurewebsites.net/api/feed?plat=web
// And find the game with the matching name
// First, grab all games from the All Games section game.title === 'All Games')

#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "rocket::serde")]
struct ApiResponse {
    items: Vec<Item>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "rocket::serde")]
struct Item {
    title: String,
    #[serde(rename = "type")]
    item_type: String,
    payload: Payload,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "rocket::serde")]
struct Payload {
    games: Vec<Game>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct Game {
    pub id: String,
    pub name: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "appIdentifier")]
    pub app_identifier: Option<String>,
    #[serde(rename = "posterImageUrl")]
    pub poster_image_url: Option<String>,
    #[serde(rename = "iconImageUrl")]
    pub icon_image_url: Option<String>,
    #[serde(rename = "appUrl")]
    pub app_url: Option<String>,
    #[serde(rename = "promoImageUrl")]
    pub promo_image_url: Option<String>,
    #[serde(rename = "pointMultiplier")]
    pub point_multiplier: Option<f64>,
    #[serde(rename = "helpUrl")]
    pub help_url: Option<String>,
    #[serde(rename = "appIdentifier")]
    pub priority: Option<i32>,
    #[serde(rename = "forceRemoteDistribution")]
    pub force_remote_distribution: Option<bool>,
}

#[get("/")]
async fn get_games() -> Result<Json<Option<Payload>>, status::Custom<String>> {
    let url = "https://playbiteapi.azurewebsites.net/api/feed?plat=web";
    match reqwest::get(url).await {
        Ok(response) => match response.json::<Vec<Item>>().await {
            Ok(items) => {
                // Filter out the part where the title is "All Games"
                let all_games_payload = items.into_iter()
                    .find(|item| item.title == "All Games")
                    .map(|item| item.payload);

                match all_games_payload {
                    Some(payload) => Ok(Json(Some(payload))),
                    None => Ok(Json(None)) // Return None if "All Games" is not found
                }
            },
            Err(e) => Err(status::Custom(Status::BadRequest, e.to_string())),
        },
        Err(e) => Err(status::Custom(Status::ServiceUnavailable, e.to_string())),
    }
}



pub fn routes() -> Vec<rocket::Route> {
    routes![get_games]
}
