import urllib.request
import os

os.makedirs("data/raw", exist_ok=True)

urllib.request.urlretrieve(
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+cumulative&format=csv",
    "data/raw/koi_cumulative.csv"
)
urllib.request.urlretrieve(
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+pscomppars&format=csv",
    "data/raw/confirmed_planets.csv"
)
print("Data downloaded successfully.")
