# Space Docker do Hugging Face para o backend online do Uaillo.
# O Space só precisa deste Dockerfile e do README.md ao lado: o código vem
# do GitHub no build. A linha ADD invalida o cache quando a main muda, então
# "Restart/Rebuild" no Space sempre pega o último commit.
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*

ARG REPO=https://github.com/theLASTofG/Uaillo.git
WORKDIR /app
ADD https://api.github.com/repos/theLASTofG/Uaillo/git/refs/heads/main /tmp/main-ref.json
RUN git clone --depth 1 "$REPO" . && npm ci --include=dev && npm run build

# Spaces rodam como usuário 1000 e expõem a porta 7860.
# O banco fica em /tmp: volta ao quadro inicial quando o Space reinicia.
ENV PORT=7860 \
    ALLOWED_ORIGINS=https://thelastofg.github.io \
    DATA_FILE=/tmp/uaillo/db.json \
    HOME=/tmp
EXPOSE 7860
USER 1000
CMD ["node", "--import", "tsx", "server/standalone.ts"]
