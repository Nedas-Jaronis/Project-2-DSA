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

    // Check if node attributes are within the given range
    bool inRange(TreeNode* node, const AttributeRange& r) {
    return (
        node->danceability >= r.minDance && node->danceability <= r.maxDance &&
        node->energy >= r.minEnergy && node->energy <= r.maxEnergy &&
        node->valence >= r.minValence && node->valence <= r.maxValence &&
        node->tempo >= r.minTempo && node->tempo <= r.maxTempo &&
        node->acousticness >= r.minAcousticness && node->acousticness <= r.maxAcousticness &&
        node->instrumentalness >= r.minInstrumentalness && node->instrumentalness <= r.maxInstrumentalness &&
        node->speechiness >= r.minSpeechiness && node->speechiness <= r.maxSpeechiness &&
        node->loudness >= r.minLoudness && node->loudness <= r.maxLoudness
        );
    }

    // DFS helper function
    void dfsHelper(TreeNode* node, const AttributeRange& r, vector<TreeNode*>& result){
        if (!node) return;
        dfsHelper(node->left, r, result);
        if(inRange(node,r)) result.push_back(node);
        dfsHelper(node->right, r, result);
    }

public:

    BinaryTree() : root(nullptr) {}

    // Insert a new node into the binary tree
    void insert(TreeNode* newNode){
        if (!root){ root = newNode; return; }
        TreeNode* curr = root;
        TreeNode* parent = nullptr;
        while (curr) { parent = curr; curr = (newNode->name < curr->name) ? curr->left : curr->right; }
        if (newNode->name < parent->name) parent->left = newNode; else parent->right = newNode;
    }

    // DFS traversal
    vector<TreeNode*> dfs(const AttributeRange& r) { 
        vector<TreeNode*> result; 
        dfsHelper(root, r, result); 
        return result; 
    }
    
    // BFS traversal
    vector<TreeNode*> bfs(const AttributeRange& r) {
        vector<TreeNode*> result;
        if (!root) return result;

        queue<TreeNode*> q; 
        q.push(root);

        while (!q.empty()) {
            TreeNode* node = q.front(); q.pop();

            if(inRange(node, r)) result.push_back(node);

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
    float minPopularity, maxPopularity; //not used in chart
    float minLoudness, maxLoudness;
    float minAcousticness, maxAcousticness;
    float minInstrumentalness, maxInstrumentalness;
    float minSpeechiness, maxSpeechiness;
    float minLiveness, maxLiveness; //not used in chart
};

//Averages for relevant data members
struct Averages {
    float dance, energy, valence, tempo;
    float acousticness, instrumentalness, speechiness, loudness;
};

//Standard Deviations for relevant data members
struct StdDevs {
    float dance, energy, valence, tempo;
    float acousticness, instrumentalness, speechiness, loudness;
};

//Retrieves average data from file
Averages getAverages(const string& filename) {
    ifstream file(filename);
    if (!file.is_open()) throw runtime_error("Failed to open averages.csv");

    Averages avg{};
    string header, line;
    getline(file, header); //header to ignore
    getline(file, line); //contains data

    stringstream ss(line);
    string value;

    //find each of the values ; skip popularity and liveness bc not on graph, 5 10
    getline(ss, value, ','); avg.dance = stof(value);
    getline(ss, value, ','); avg.energy = stof(value);
    getline(ss, value, ','); avg.valence = stof(value);
    getline(ss, value, ','); avg.valence = stof(value);
    getline(ss, value, ',');
    getline(ss, value, ','); avg.loudness = stof(value);
    getline(ss, value, ','); avg.acousticness = stof(value);
    getline(ss, value, ','); avg.instrumentalness = stof(value);
    getline(ss, value, ','); avg.speechiness = stof(value);

    return avg;
}

//Calculates standard deviation from data in file
StdDevs getStandardDevs(const string& filename, const Averages& avg) {
    ifstream file(filename);
    if (!file.is_open()) throw runtime_error("Failed to open tracks.csv");

    string header, line;
    getline(file, header); //ignore
    
    int count = 0;
    double sumDance = 0, sumEnergy = 0, sumValence = 0, sumTempo = 0, sumAcoustic = 0, sumInstrumental = 0, sumSpeech = 0, sumLoud = 0;

    while (getline(file, line)) {
        stringstream ss(line);
        string value;

        // Skip irrelevant fields
        for (int i = 0; i < 8; i++) getline(ss, value, ',');
        getline(ss, value, ','); double dance = stod(value);
        getline(ss, value, ','); double energy = stod(value);
        getline(ss, value, ',');
        getline(ss, value, ','); double loud = stod(value);
        getline(ss, value, ',');
        getline(ss, value, ','); double speech = stod(value);
        getline(ss, value, ','); double acoustic = stod(value);
        getline(ss, value, ','); double instrumental = stod(value);
        getline(ss, value, ',');
        getline(ss, value, ','); double valence = stod(value);
        getline(ss, value, ','); double tempo = stod(value);

        // Squared differences for standard deviation calculation
        sumDance += pow(dance - avg.dance, 2);
        sumEnergy += pow(energy - avg.energy, 2);
        sumValence += pow(valence - avg.valence, 2);
        sumTempo += pow(tempo - avg.tempo, 2);
        sumAcoustic += pow(acoustic - avg.acousticness, 2);
        sumInstrumental += pow(instrumental - avg.instrumentalness, 2);
        sumSpeech += pow(speech - avg.speechiness, 2);
        sumLoud += pow(loud - avg.loudness, 2);

        count++;
    }

    StdDevs sd{};
    sd.dance = sqrt(sumDance / count);
    sd.energy = sqrt(sumEnergy / count);
    sd.valence = sqrt(sumValence / count);
    sd.tempo = sqrt(sumTempo / count);
    sd.acousticness = sqrt(sumAcoustic / count);
    sd.instrumentalness = sqrt(sumInstrumental / count);
    sd.speechiness = sqrt(sumSpeech / count);
    sd.loudness = sqrt(sumLoud / count);
}

//calculates upper and lower bounds for ranges of data
AttributeRange makeRanges(const Averages& avg, const StdDevs& sd, float k = 0.5f) {
    AttributeRange r;

    r.minDance = avg.dance - k * sd.dance;
    r.maxDance = avg.dance + k * sd.dance;
    r.minEnergy = avg.energy - k * sd.energy;
    r.maxEnergy = avg.energy + k * sd.energy;
    r.minValence = avg.valence - k * sd.valence;
    r.maxValence = avg.valence + k * sd.valence;
    r.minLoudness = avg.loudness - k * sd.loudness;
    r.maxLoudness = avg.loudness + k * sd.loudness;
    r.minTempo = avg.tempo - k * sd.tempo;
    r.maxTempo = avg.tempo + k * sd.tempo;
    r.minAcousticness = avg.acousticness - k * sd.acousticness;
    r.maxAcousticness = avg.acousticness + k * sd.acousticness;
    r.minInstrumentalness = avg.instrumentalness - k * sd.instrumentalness;
    r.maxInstrumentalness = avg.instrumentalness + k * sd.instrumentalness;
    r.minSpeechiness = avg.speechiness - k * sd.speechiness;
    r.maxSpeechiness = avg.speechiness + k * sd.speechiness;

    return r;
}

//to help parse CSV line
vector<string> parseCSVLine(const string& line) {
    vector<string> fields;
    stringstream ss(line);
    string field;
    bool inQuotes = false;

    for (size_t i = 0; i < line.length(); i++) {
        char c = line[i];
        if (c == '"') {
            inQuotes = !inQuotes;
        }
        else if (c == ',' && !inQuotes) {
            fields.push_back(field);
            field.clear();
        }
        else {
            field += c;
        }
    }
    fields.push_back(field);
    return fields;
}

int main(int argc, char* argv[]) {
    if (argc < 2) { //example call: ./recommendation BFS 0.5 --> k value could theoretically be changed to alter recommendation range, BFS and DFS are primary options
        cerr << "Format:" << argv[0] << " < BFS | DFS >  [k_value]" << endl;
        return 1;
    }

    string searchType = argv[1]; //BFS or DFS
    float k = 0.5f; //will recommend within +- 0.5 standard deviations
    if (argc >= 3) k = stof(argv[2]);

    try {
        //get averages
        Averages avg = getAverages("data/averages.csv");
        
        //get standard deviations
        StdDevs sd = getStandardDevs("data/tracks.csv", avg);

        //create ranges
        AttributeRange range = makeRanges(avg, sd, k);

        //build tree from tracks.csv, will be what we traverse
        BinaryTree tree;
        ifstream file("data/tracks.csv");
        if (!file.is_open()) throw runtime_error("Failed to open tracks.csv");

        //ignore header
        string header;
        getline(file, header);

        //get data for the tree nodes
        string line;
        while (getline(file, line)) {
            //parse line using helper function
            vector<string> fields = parseCSVLine(line);
            if (fields.size() < 20) continue; //ensure all data

            TreeNode* node = new TreeNode(
                fields[1],        // name
                fields[2],        // id
                stoi(fields[2]),  // popularity
                stoi(fields[3]),  // duration
                stoi(fields[4]),  // explicit
                {},               // artists
                fields[7],        // release date
                stof(fields[8]),  // danceability
                stof(fields[9]),  // energy
                stoi(fields[10]), // key
                stof(fields[11]), // loudness
                stoi(fields[12]), // mode
                stof(fields[13]), // speechiness
                stof(fields[14]), // acousticness
                stof(fields[15]), // instrumentalness
                stof(fields[16]), // liveness
                stof(fields[17]), // valence
                stof(fields[18]), // tempo
                stoi(fields[19])  // time signature
            );
            tree.insert(node);
        }
        file.close();

        //searching
        vector<TreeNode*> results;
        if (searchType == "BFS") {
            results = tree.bfs(range);
        }
        else if (searchType == "DFS") {
            results = tree.dfs(range);
        }
        else {
            cerr << "Invalid search" << endl;
            return 1;
        }

        //output results as JSON for use with frontend, array formated
        cout << "[";
        for (size_t i = 0; i < results.size(); i++) {
            if (i > 0) cout << ",";
            cout << "\"" << results[i]->name << "\"";
        }
        cout << "]";

    }//try/catch to test for errors
    catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }

    return 0;
}