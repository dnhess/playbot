mod games;
mod game;
mod user;

pub fn games_routes_config(cfg: &mut actix_web::web::ServiceConfig) {
  cfg.service(actix_web::web::scope("/api/v1/games").service(games::get_all_games))
    .service(actix_web::web::scope("/api/v1/game").service(game::get_game))
    .service(actix_web::web::scope("/api/v1/user").service(user::get_user));
}