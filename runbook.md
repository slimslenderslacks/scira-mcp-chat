```sh
docker run --rm -it --name postgres-client postgres:15-alpine psql -h host.docker.internal -U slim -p 5432 -d chatstore
```

```sh
DATABASE_URL=postgresql://slim:pass@host.docker.internal:5432/chatstore
docker run --rm -it --name postgres-client postgres:15-alpine psql $DATABASE_URL
```

```sh
pnpm drizzle-kit push:pg --driver pg --schema ./lib/db/schema.ts --connectionString postgresql://slim:pass@localhost:5432/chatstore
```

```sh
docker volume rm docker-prompts
docker volume rm docker-prompts-git
docker volume rm scira-mcp-chat_chat_store
```

```sh
docker container rm docker-prompts
```

```sh
docker buildx build \
              --builder hydrobuild \
              --push \
              -t jimclark106/initialize-chat-store-schema \
              --platform linux/amd64,linux/arm64 \
              --file Dockerfile.initialize-chat-store-schema \
              .
```

```sh
docker buildx build \
              -t jimclark106/mcp-ui \
              --platform linux/amd64,linux/arm64 \
              --builder hydrobuild \
              --push \
              --file Dockerfile \
              .
```
