pub struct Application {
    port: u16,
    server: actix_web::dev::Server,
}

impl Application {
    pub async fn build(settings: crate::settings::Settings) -> Result<Self, std::io::Error> {
        let address = format!(
            "{}:{}",
            settings.application.host, settings.application.port
        );

        let listener = std::net::TcpListener::bind(&address)?;
        let port = listener.local_addr().unwrap().port();
        let server = run(listener, settings).await?;

        tracing::event!(target: "backend", tracing::Level::INFO, "Listening on address {}", address);

        Ok(Self { port, server })
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    pub async fn run_until_stopped(self) -> Result<(), std::io::Error> {
        self.server.await
    }
}

async fn run(
    listener: std::net::TcpListener,
    settings: crate::settings::Settings,
) -> Result<actix_web::dev::Server, std::io::Error> {
    // Redis connection pool
    let cfg = deadpool_redis::Config::from_url(settings.clone().redis.uri);

    // Create MonoDB client

    let mongo_client = settings.clone().mongo.init().await.unwrap();

    let redis_pool = cfg
        .create_pool(Some(deadpool_redis::Runtime::Tokio1))
        .expect("Cannot create deadpool redis.");

    let redis_pool_data = actix_web::web::Data::new(redis_pool);

    let server = actix_web::HttpServer::new(move || {
        actix_web::App::new()
            .service(crate::routes::health_check)
            .configure(crate::routes::games_routes_config)
            .app_data(redis_pool_data.clone())
            .app_data(actix_web::web::Data::new(mongo_client.clone()))
    })
    .listen(listener)?
    .run();

    Ok(server)
}
