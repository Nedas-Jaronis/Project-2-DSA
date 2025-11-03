#include <iostream>
#include <queue>
#include <vector>
#include <fstream>
#include <sstream>
#include <algorithm>
using namespace std;

class TreeNode {
public:
    string name;
    string id;
    int popularity;
    int duration_ms;
    int isExplicit;
    vector<string> artists;
    string releaseDate;
    float danceability;
    float energy;
    int key;
    float loudness;
    int mode;
    float speechiness;
    float acousticness;
    float instrumentalness;
    float liveness;
    float valence;
    float tempo;
    int time_signature;
    TreeNode* left;
    TreeNode* right;

    TreeNode(string name, string id = "", int popularity = 0, int duration_ms = 0,
             int isExplicit = 0, vector<string> artists = {},
             string releaseDate = "", float danceability = 0.0f, float energy = 0.0f,
             int key = 0, float loudness = 0.0f, int mode = 0, float speechiness = 0.0f,
             float acousticness = 0.0f, float instrumentalness = 0.0f, float liveness = 0.0f,
             float valence = 0.0f, float tempo = 0.0f, int time_signature = 4)
        : name(name), id(id), popularity(popularity), duration_ms(duration_ms), isExplicit(isExplicit),
          artists(artists), releaseDate(releaseDate),
          danceability(danceability), energy(energy), key(key), loudness(loudness), mode(mode),
          speechiness(speechiness), acousticness(acousticness), instrumentalness(instrumentalness),
          liveness(liveness), valence(valence), tempo(tempo), time_signature(time_signature),
          left(nullptr), right(nullptr) {}
};

class BinaryTree {
private:
    TreeNode* root;
    void dfsHelper(TreeNode* node, vector<TreeNode*>& result){
        if (!node) return;
        dfsHelper(node->left, result);
        result.push_back(node);
        dfsHelper(node->right, result);
    }
public:
    BinaryTree() : root(nullptr) {}
    void insert(TreeNode* newNode){
        if (!root){ root = newNode; return; }
        TreeNode* curr = root;
        TreeNode* parent = nullptr;
        while (curr) { parent = curr; curr = (newNode->name < curr->name) ? curr->left : curr->right; }
        if (newNode->name < parent->name) parent->left = newNode; else parent->right = newNode;
    }
    vector<TreeNode*> dfs() { vector<TreeNode*> result; dfsHelper(root, result); return result; }
    vector<TreeNode*> bfs() {
        vector<TreeNode*> result;
        if (!root) return result;
        queue<TreeNode*> q; q.push(root);
        while (!q.empty()) {
            TreeNode* node = q.front(); q.pop();
            result.push_back(node);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        return result;
    }
};

// Attribute ranges
struct AttributeRange {
    float minDance, maxDance;
    float minEnergy, maxEnergy;
    float minValence, maxValence;
    float minTempo, maxTempo;
    float minPopularity, maxPopularity;
    float minLoudness, maxLoudness;
    float minAcousticness, maxAcousticness;
    float minInstrumentalness, maxInstrumentalness;
    float minSpeechiness, maxSpeechiness;
    float minLiveness, maxLiveness;
};

// Parse CSV line
vector<string> parseCSVLine(const string& line) {
    vector<string> tokens;
    string token;
    bool inQuotes = false;
    for (char c : line) {
        if (c == '"') inQuotes = !inQuotes;
        else if (c == ',' && !inQuotes) { tokens.push_back(token); token.clear(); }
        else token += c;
    }
    tokens.push_back(token);
    return tokens;
}

// Load songs into tree
void loadSongs(const string& filePath, BinaryTree& tree) {
    ifstream file(filePath);
    if (!file.is_open()) { cerr << "Cannot open file\n"; return; }
    string line; getline(file, line); // skip header
    while (getline(file, line)) {
        vector<string> fields = parseCSVLine(line);
        if (fields.size() < 20) continue;
        string name = fields[1];
        string id = fields[0];
        int popularity = stoi(fields[2]);
        int duration_ms = stoi(fields[3]);
        int isExplicit = stoi(fields[4]);
        string artistsRaw = fields[5];
        string releaseDate = fields[7];
        float danceability = stof(fields[8]);
        float energy = stof(fields[9]);
        int key = stoi(fields[10]);
        float loudness = stof(fields[11]);
        int mode = stoi(fields[12]);
        float speechiness = stof(fields[13]);
        float acousticness = stof(fields[14]);
        float instrumentalness = stof(fields[15]);
        float liveness = stof(fields[16]);
        float valence = stof(fields[17]);
        float tempo = stof(fields[18]);
        int time_signature = stoi(fields[19]);
        // parse artists
        artistsRaw.erase(remove(artistsRaw.begin(), artistsRaw.end(), '['), artistsRaw.end());
        artistsRaw.erase(remove(artistsRaw.begin(), artistsRaw.end(), ']'), artistsRaw.end());
        artistsRaw.erase(remove(artistsRaw.begin(), artistsRaw.end(), '\''), artistsRaw.end());
        vector<string> artists; stringstream ss(artistsRaw); string a;
        while (getline(ss,a,',')){ a.erase(0,a.find_first_not_of(" \t")); a.erase(a.find_last_not_of(" \t")+1); if(!a.empty()) artists.push_back(a); }
        TreeNode* node = new TreeNode(name,id,popularity,duration_ms,isExplicit,artists,releaseDate,
                                      danceability,energy,key,loudness,mode,speechiness,acousticness,
                                      instrumentalness,liveness,valence,tempo,time_signature);
        tree.insert(node);
    }
}

// Load averages CSV for range
AttributeRange loadRangesCSV(const string& filePath) {
    ifstream file(filePath);
    AttributeRange range{};
    if (!file.is_open()) { cerr << "Cannot open averages CSV\n"; return range; }
    string header, line;
    getline(file, header);
    if (!getline(file, line)) return range;
    vector<string> fields = parseCSVLine(line);
    float delta = 0.1;
    range.minDance = stof(fields[0])-delta; range.maxDance = stof(fields[0])+delta;
    range.minEnergy = stof(fields[1])-delta; range.maxEnergy = stof(fields[1])+delta;
    range.minValence = stof(fields[2])-delta; range.maxValence = stof(fields[2])+delta;
    range.minTempo = stof(fields[3])-5; range.maxTempo = stof(fields[3])+5;
    range.minPopularity = stof(fields[4])-10; range.maxPopularity = stof(fields[4])+10;
    range.minLoudness = stof(fields[5])-2; range.maxLoudness = stof(fields[5])+2;
    range.minAcousticness = stof(fields[6])-0.05; range.maxAcousticness = stof(fields[6])+0.05;
    range.minInstrumentalness = stof(fields[7])-0.05; range.maxInstrumentalness = stof(fields[7])+0.05;
    range.minSpeechiness = stof(fields[8])-0.02; range.maxSpeechiness = stof(fields[8])+0.02;
    range.minLiveness = stof(fields[9])-0.05; range.maxLiveness = stof(fields[9])+0.05;
    return range;
}

// Check if song is within range
bool inRange(TreeNode* node, const AttributeRange& range) {
    return node->danceability >= range.minDance && node->danceability <= range.maxDance &&
           node->energy >= range.minEnergy && node->energy <= range.maxEnergy &&
           node->valence >= range.minValence && node->valence <= range.maxValence &&
           node->tempo >= range.minTempo && node->tempo <= range.maxTempo &&
           node->popularity >= range.minPopularity && node->popularity <= range.maxPopularity &&
           node->loudness >= range.minLoudness && node->loudness <= range.maxLoudness &&
           node->acousticness >= range.minAcousticness && node->acousticness <= range.maxAcousticness &&
           node->instrumentalness >= range.minInstrumentalness && node->instrumentalness <= range.maxInstrumentalness &&
           node->speechiness >= range.minSpeechiness && node->speechiness <= range.maxSpeechiness &&
           node->liveness >= range.minLiveness && node->liveness <= range.maxLiveness;
}

// Filter songs
vector<TreeNode*> filterSongs(const vector<TreeNode*>& songs, const AttributeRange& range) {
    vector<TreeNode*> result;
    for (TreeNode* node : songs) if (inRange(node, range)) result.push_back(node);
    return result;
}

int main() {
    BinaryTree tree;
    string csvPath = "data/tracks.csv";
    string averagesCSV = "data/averages.csv";

    loadSongs(csvPath, tree);
    AttributeRange range = loadRangesCSV(averagesCSV);

    vector<TreeNode*> dfsSongs = filterSongs(tree.dfs(), range);
    vector<TreeNode*> bfsSongs = filterSongs(tree.bfs(), range);

    cout << "Songs in DFS within range: " << dfsSongs.size() << "\n";
    cout << "Songs in BFS within range: " << bfsSongs.size() << "\n";

    for (int i=0; i<min(10,(int)dfsSongs.size()); i++) cout << dfsSongs[i]->name << "\n";

    return 0;
}
