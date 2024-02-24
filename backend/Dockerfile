FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder 
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY . .
RUN cargo build --release --bin backend

FROM debian:bookworm-slim AS runtime
# Install OpenSSL libraries and update CA certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  ca-certificates \
  libssl3 \
  && rm -rf /var/lib/apt/lists/*
RUN update-ca-certificates
WORKDIR /app
# Copy the binary from the build stage
COPY --from=builder /app/target/release/backend /usr/local/bin
# Copy the settings directory
COPY settings /app/settings
ENTRYPOINT ["/usr/local/bin/backend"]

CMD [ "backend" ]