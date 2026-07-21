# Packages installed in the Docker image.
# tidyverse base already ships dplyr/jsonlite (and stringi), so those are
# effectively no-ops; stringdist + plumber are compiled.
options(repos = c(CRAN = "https://cloud.r-project.org"))

# Only install what the base image doesn't already provide (dplyr/jsonlite ship
# with rocker/tidyverse).
pkgs <- c("dplyr", "stringdist", "plumber", "jsonlite")
missing <- pkgs[!vapply(pkgs, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing) > 0) install.packages(missing)

# install.packages only warns on failure, which would otherwise let the image
# build "succeed" with a broken service. Fail the build loudly instead.
for (p in pkgs) {
  if (!requireNamespace(p, quietly = TRUE)) {
    stop("Required R package failed to install: ", p)
  }
}
