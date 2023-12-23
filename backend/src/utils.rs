// In util.rs or a similar module

use deadpool_redis::{Connection, redis::{cmd, self}};
use serde::Serialize;
use serde_json;
use serde::de::DeserializeOwned;


pub async fn cache_in_redis<T: Serialize>(
    key: &str,
    value: &T,
    connection: &mut Connection,
) -> Result<(), ()> {
    let value_json = match serde_json::to_string(value) {
        Ok(json) => json,
        Err(_) => return Err(()),
    };

    cmd("SET")
        .arg(key)
        .arg(&value_json)
        .query_async::<_, ()>(connection)
        .await
        .map_err(|_| ())
}

pub async fn fetch_from_redis<T: DeserializeOwned>(
    key: &str,
    connection: &mut Connection,
) -> Result<T, redis::RedisError> {
    let redis_result: Result<String, redis::RedisError> = cmd("GET")
        .arg(key)
        .query_async(connection)
        .await;

    match redis_result {
        Ok(json) => serde_json::from_str(&json).map_err(|err| {
            redis::RedisError::from((
                redis::ErrorKind::TypeError,
                "Serialization Error",
                err.to_string(),
            ))
        }),
        Err(e) => Err(e),
    }
}
