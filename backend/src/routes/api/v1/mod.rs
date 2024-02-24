mod game;
mod games;
mod leaderboard;
mod reactions;
mod user;

pub fn games_routes_config(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(actix_web::web::scope("/api/v1/games").service(games::get_all_games))
        .service(actix_web::web::scope("/api/v1/game").service(game::get_game))
        .service(actix_web::web::scope("/api/v1/user").service(user::get_user))
        .service(
            actix_web::web::scope("/api/v1/guild/{guild_id}/user/{user_id}/rank")
                .service(leaderboard::get_user_rank),
        )
        .service(
            actix_web::web::scope("/api/v1/guild/{guild_id}/leaderboard")
                .service(leaderboard::get_top_users),
        )
        .service(
            actix_web::web::scope("/api/v1/guild/{guild_id}/message")
                .service(reactions::get_reaction),
        );
}
