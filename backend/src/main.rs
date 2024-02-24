#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    let settings = backend::settings::get_settings().expect("Failed to read settings.");

    let subscriber = backend::telemetry::get_subscriber(settings.clone().debug);
    backend::telemetry::init_subscriber(subscriber);

    let application = backend::startup::Application::build(settings).await?;

    tracing::event!(target: "backend", tracing::Level::INFO, "Listening on port {}", application.port());

    application.run_until_stopped().await?;
    Ok(())
}
