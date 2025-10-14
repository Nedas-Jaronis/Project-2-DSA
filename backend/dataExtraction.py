import kagglehub
import pandas as pd
import os

# Download dataset
path = kagglehub.dataset_download(
    "yamaerenay/spotify-dataset-19212020-600k-tracks")
csv_file = os.path.join(path, "tracks.csv")

# Load full CSV
df = pd.read_csv(csv_file)

# Extract only the song names column and remove duplicates/nulls
song_names = df["name"].dropna().drop_duplicates()

# Save to a smaller CSV for your backend
output_path = "data/song_names.csv"
os.makedirs("data", exist_ok=True)
song_names.to_csv(output_path, index=False, header=["name"])

print(f"✅ Saved {len(song_names)} unique song names to {output_path}")
