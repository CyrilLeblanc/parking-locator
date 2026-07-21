# Parking natural-language agent.
#
# Faithful port of the original exploratory script (thing.txt): the parsing,
# filtering, ranking and medal logic is kept verbatim. Only the I/O changes —
# instead of building a leaflet map, the agent returns a plain list that the
# plumber API serializes to JSON. Route drawing (OSRM), popup HTML and marker
# coloring are intentionally dropped: rendering is the React app's job.
#
# Required columns on `data`:
#   id, nom, ylat, xlong, gratuit (logical),
#   nb_places, nb_voitures_electriques, nb_velo, nb_pmr, nb_covoit (numeric)

library(dplyr)
library(stringdist)

# ---------------------------------------------------------------------------
# Distance (great-circle, km)
# ---------------------------------------------------------------------------
haversine <- function(lat1, lon1, lat2, lon2) {
  R <- 6371

  dlat <- (lat2 - lat1) * pi / 180
  dlon <- (lon2 - lon1) * pi / 180

  a <- sin(dlat / 2)^2 +
    cos(lat1 * pi / 180) * cos(lat2 * pi / 180) *
    sin(dlon / 2)^2

  2 * R * asin(sqrt(a))
}

# ---------------------------------------------------------------------------
# Fuzzy keyword match (Jaro-Winkler similarity, as in the original script)
# ---------------------------------------------------------------------------
match_keyword <- function(question, keywords, max_dist = 0.2) {
  words <- unlist(strsplit(tolower(question), "\\s+"))

  for (w in words) {
    sims <- stringdist::stringsim(w, keywords, method = "jw")
    if (max(sims) >= (1 - max_dist)) return(TRUE)
  }

  FALSE
}

# ---------------------------------------------------------------------------
# Negation detection ("pas de", "pas", "sans", "non" before the keyword)
# ---------------------------------------------------------------------------
is_negative <- function(question, keyword) {
  pattern <- paste0("(pas\\s+de\\s+|pas\\s+|sans\\s+|non\\s+)", keyword)
  grepl(pattern, question, ignore.case = TRUE)
}

# ---------------------------------------------------------------------------
# Main agent
# ---------------------------------------------------------------------------
# Returns a list:
#   message           (chr)            — human-readable result count
#   ranking_criterion (chr | NA)       — "capacity" | "ev" | "pmr" | "carpool" | "distance"
#   intent            (list)           — top_n (int | NA), filters (chr[])
#   results           (data.frame)     — id, rank, medal, distance_km
parking_agent <- function(question, data, user_lat = NULL, user_lon = NULL) {
  question <- tolower(question)
  result <- data
  ranking_criterion <- NA_character_

  # -------------------------- top N extraction -----------------------------
  n_limit <- NA_integer_
  top_match <- regexpr("top\\s*[0-9]+", question)

  if (top_match[1] != -1) {
    top_str <- regmatches(question, top_match)
    n_limit <- as.integer(gsub("[^0-9]", "", top_str))
  }

  # --------------------------- flags (display) -----------------------------
  show_tarif <- match_keyword(question, c("gratuit", "payant", "tarif", "prix"))
  show_distance <- match_keyword(question, c("proche", "pres", "proximite", "autour"))
  show_elec <- match_keyword(question, c("electrique", "borne", "recharge", "elec"))
  show_pmr <- match_keyword(question, c("pmr", "handicap"))
  show_capacity <- match_keyword(question, c("places", "capacite", "capacité", "grand", "parking"))
  show_velo <- match_keyword(question, c("velo", "velos", "vélo", "vélos"))

  # --------------------------- flags (ranking) -----------------------------
  rank_elec <- match_keyword(question, c("elec", "electrique", "borne", "recharge"))
  rank_capacity <- match_keyword(question, c("places", "capacite", "capacité", "grand"))
  rank_pmr <- match_keyword(question, c("pmr", "handicap", "accessible"))
  rank_covoit <- match_keyword(question, c("covoit", "covoiturage", "partage", "carpool"))

  # ---------------------------- business filters ---------------------------
  neg_gratuit <- is_negative(question, "gratuit")

  if (match_keyword(question, c("gratuit", "free"))) {
    if (neg_gratuit) {
      result <- result %>% dplyr::filter(gratuit == FALSE)
    } else {
      result <- result %>% dplyr::filter(gratuit == TRUE)
    }
  }

  neg_elec <- is_negative(question, "(electrique|elec|borne|recharge)")

  if (show_elec) {
    if (neg_elec) {
      result <- result %>%
        dplyr::filter(is.na(nb_voitures_electriques) | nb_voitures_electriques == 0)
    } else {
      result <- result %>%
        dplyr::filter(!is.na(nb_voitures_electriques), nb_voitures_electriques > 0)
    }
  }

  neg_velo <- is_negative(question, "(velo|velos|vélo|vélos)")

  if (show_velo) {
    if (neg_velo) {
      result <- result %>%
        dplyr::filter(is.na(nb_velo) | nb_velo == 0)
    } else {
      result <- result %>%
        dplyr::filter(!is.na(nb_velo), nb_velo > 0)
    }
  }

  # ------------------------------- distance --------------------------------
  if (show_distance && !is.null(user_lat) && !is.null(user_lon) && nrow(result) > 0) {
    result$distance <- haversine(user_lat, user_lon, result$ylat, result$xlong)
    result <- result %>% dplyr::arrange(distance)
  }

  # --------------------------- top N + ranking -----------------------------
  if (!is.na(n_limit) && nrow(result) > 0) {
    if (rank_elec) {
      result <- result %>% dplyr::arrange(desc(nb_voitures_electriques))
      ranking_criterion <- "ev"
    } else if (rank_capacity) {
      result <- result %>% dplyr::arrange(desc(nb_places))
      ranking_criterion <- "capacity"
    } else if (rank_pmr) {
      result <- result %>% dplyr::arrange(desc(nb_pmr))
      ranking_criterion <- "pmr"
    } else if (rank_covoit) {
      result <- result %>% dplyr::arrange(desc(nb_covoit))
      ranking_criterion <- "carpool"
    } else if (show_distance && "distance" %in% names(result)) {
      result <- result %>% dplyr::arrange(distance)
      ranking_criterion <- "distance"
    }

    # clamp top N to the available count
    n_limit <- min(n_limit, nrow(result))
    result <- dplyr::slice_head(result, n = n_limit)

    # medals
    result$medal_color <- "normal"
    if (nrow(result) >= 1) result$medal_color[1] <- "gold"
    if (nrow(result) >= 2) result$medal_color[2] <- "silver"
    if (nrow(result) >= 3) result$medal_color[3] <- "bronze"
  }

  # ----------------------------- build output ------------------------------
  n <- nrow(result)

  has_distance <- "distance" %in% names(result)
  has_medal <- "medal_color" %in% names(result)

  if (n == 0) {
    results_df <- data.frame(
      id = character(0), rank = integer(0),
      medal = character(0), distance_km = numeric(0),
      stringsAsFactors = FALSE
    )
  } else {
    medal <- if (has_medal) result$medal_color else rep(NA_character_, n)
    medal[medal == "normal"] <- NA_character_
    distance_km <- if (has_distance) as.numeric(result$distance) else rep(NA_real_, n)

    results_df <- data.frame(
      id = as.character(result$id),
      rank = seq_len(n),
      medal = medal,
      distance_km = distance_km,
      stringsAsFactors = FALSE
    )
  }

  # active filters, for the client to display as the "reason"
  filters <- character(0)
  if (match_keyword(question, c("gratuit", "free"))) filters <- c(filters, "gratuit")
  if (show_elec) filters <- c(filters, "ev")
  if (show_velo) filters <- c(filters, "bike")

  list(
    message = paste0(n, " résultats trouvés"),
    ranking_criterion = ranking_criterion,
    intent = local({
      # top_n is only present when the query asked for one. Omitting the field
      # (rather than NA/NULL) avoids jsonlite rendering an unboxed integer NA as
      # the string "NA" or NULL as "{}".
      x <- list(
        # I() prevents jsonlite auto_unbox from collapsing a single-element
        # filters vector into a bare string.
        filters = I(filters)
      )
      if (!is.na(n_limit)) x$top_n <- n_limit
      x
    }),
    results = results_df
  )
}
