import requests

response = requests.get("http://localhost:5000/api/current-songs")
songs = response.json().get("addedSongs", []) # Current inputted playlist
print("🎵 Current songs:", songs)
