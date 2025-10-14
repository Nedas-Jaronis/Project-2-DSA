import kagglehub
import pandas as pd
import os

# Download the dataset
path = kagglehub.dataset_download(
    "yamaerenay/spotify-dataset-19212020-600k-tracks")

# Show the path to see what was downloaded
print("Dataset downloaded to:", path)

# List all files in the downloaded path
for root, dirs, files in os.walk(path):
    for file in files:
        print("Found file:", file)

# Load a CSV file (replace the filename with the correct one you find above)
# Adjust this if the file has a different name
csv_file = os.path.join(path, "tracks.csv")

# Load the CSV into pandas
df = pd.read_csv(csv_file)

# Show the first few rows
print(df.head())
