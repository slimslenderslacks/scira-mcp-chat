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
