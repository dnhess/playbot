mod games;

pub fn games_routes_config(cfg: &mut actix_web::web::ServiceConfig) {
  cfg.service(actix_web::web::scope("/api/v1/games").service(games::get_all_games));
}