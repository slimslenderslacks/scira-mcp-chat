```sh
docker run --rm -it --name postgres-client postgres:15-alpine psql -h host.docker.internal -U slim -p 5432 -d chatstore
```

```sh
DATABASE_URL=postgresql://slim:pass@host.docker.internal:5432/chatstore
docker run --rm -it --name postgres-client postgres:15-alpine psql $DATABASE_URL
```

