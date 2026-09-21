import pandas as pd
import time

start = time.time()
koi = pd.read_csv("data/raw/koi_cumulative.csv", comment="#")
confirmed = pd.read_csv("data/raw/confirmed_planets.csv", comment="#", low_memory=False)
print("KOI shape:", koi.shape)
print("Confirmed shape:", confirmed.shape)
print(f"Took {time.time() - start:.2f} seconds")
