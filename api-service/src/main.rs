#[macro_use] extern crate rocket;

// Import game module

mod games;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![index])
    .mount(
      "/games", games::routes())
}