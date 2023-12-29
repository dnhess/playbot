mod games;
mod game;
mod user;
mod leaderboard;

pub fn games_routes_config(cfg: &mut actix_web::web::ServiceConfig) {
  cfg.service(actix_web::web::scope("/api/v1/games").service(games::get_all_games))
    .service(actix_web::web::scope("/api/v1/game").service(game::get_game))
    .service(actix_web::web::scope("/api/v1/user").service(user::get_user))
    .service(actix_web::web::scope("/api/v1/rank").service(leaderboard::get_user_rank))
    .service(actix_web::web::scope("/api/v1").service(leaderboard::get_top_users));
}