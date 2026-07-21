# Plumber HTTP API exposing the parking natural-language agent.
# Run: plumber::plumb("plumber.R")$run(host = "0.0.0.0", port = 8000)

# Load the agent (and its dependencies) into this environment.
source("agent.R")

#* @apiTitle Parking NLP agent
#* @apiDescription Natural-language query engine for parkings.

#* Use a JSON serializer that auto-unboxes length-1 vectors, so scalars
#* (message, ranking_criterion, top_n) serialize as scalars instead of
#* single-element arrays. `I(filters)` in agent.R keeps the filters array.
#* @plumber
function(pr) {
  plumber::pr_set_serializer(pr, plumber::serializer_json(auto_unbox = TRUE))
}

#* Service health check (used by the Docker healthcheck).
#* @get /health
function() {
  list(status = "ok")
}

#* Query parkings in natural language.
#*
#* Body (JSON):
#*   question  (chr)            — the user query, e.g. "gratuit top 5"
#*   parkings  (PlumberRow[])   — parkings to search across
#*   lat       (num, optional)  — user latitude (enables distance ranking)
#*   lon       (num, optional)  — user longitude
#*
#* @post /query
function(req, res) {
  body <- req$body

  question <- body$question
  if (is.null(question) || !nzchar(trimws(as.character(question)))) {
    res$status <- 400
    return(list(error = "Missing or empty 'question'"))
  }

  parkings <- body$parkings
  if (is.null(parkings) || length(parkings) == 0) {
    res$status <- 400
    return(list(error = "Missing 'parkings'"))
  }

  # Build a typed data.frame from the JSON rows.
  df <- dplyr::bind_rows(parkings)
  df$id <- as.character(df$id)
  df$nom <- as.character(df$nom)
  df$ylat <- as.numeric(df$ylat)
  df$xlong <- as.numeric(df$xlong)
  df$gratuit <- as.logical(df$gratuit)
  df$nb_places <- as.numeric(df$nb_places)
  df$nb_voitures_electriques <- as.numeric(df$nb_voitures_electriques)
  df$nb_velo <- as.numeric(df$nb_velo)
  df$nb_pmr <- as.numeric(df$nb_pmr)
  df$nb_covoit <- as.numeric(df$nb_covoit)

  user_lat <- if (is.null(body$lat)) NULL else as.numeric(body$lat)
  user_lon <- if (is.null(body$lon)) NULL else as.numeric(body$lon)

  parking_agent(
    question = question,
    data = df,
    user_lat = user_lat,
    user_lon = user_lon
  )
}
