import kagglehub

# Download latest version
path = kagglehub.dataset_download(
    "yamaerenay/spotify-dataset-19212020-600k-tracks")

print("Path to dataset files:", path)
