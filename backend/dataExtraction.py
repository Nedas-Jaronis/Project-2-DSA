import kagglehub
import pandas as pd
import os

# Ensure the /backend/data folder exists
data_folder = os.path.join("backend", "data")
os.makedirs(data_folder, exist_ok=True)

# Download dataset
path = kagglehub.dataset_download(
    "yamaerenay/spotify-dataset-19212020-600k-tracks")
csv_file = os.path.join(path, "tracks.csv")

# Prepare writers
full_csv_path = os.path.join(data_folder, "tracks.csv")
song_names_path = os.path.join(data_folder, "song_names.csv")

song_names_set = set()
first_chunk = True

for chunk in pd.read_csv(csv_file, chunksize=50000):
    # Append to full CSV
    chunk.to_csv(full_csv_path, mode='a', header=first_chunk, index=False)
    first_chunk = False

    # Collect song names
    song_names_set.update(chunk["name"].dropna().unique())

# Save unique song names
pd.Series(list(song_names_set), name="name").to_csv(
    song_names_path, index=False)

print(f"Saved full dataset to {full_csv_path}")
print(f"Saved {len(song_names_set)} unique song names to {song_names_path}")
