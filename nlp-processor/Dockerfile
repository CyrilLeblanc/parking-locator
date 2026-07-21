# Stateless R microservice exposing the parking NLP agent via plumber.
#
# Bases on rocker/tidyverse (not rocker/r-ver): it ships the system dev
# libraries (libcurl, libssl, libxml2) that plumber/httpuv/curl need to
# compile, and it comes with dplyr/stringi prebuilt — which removes the very
# slow bundled-ICU compilation from the build.
FROM rocker/tidyverse:4.4.3

# libsodium-dev for the R 'sodium' package; wget for the Docker healthcheck.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libsodium-dev wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install R dependencies (fail fast if any package is missing — see install.R).
COPY install.R .
RUN Rscript install.R

# Application code.
COPY agent.R plumber.R ./

EXPOSE 8000

# plumb() loads plumber.R (which sources agent.R) and serves on :8000.
CMD ["R", "-e", "plumber::plumb('plumber.R')$run(host='0.0.0.0', port=8000)"]
