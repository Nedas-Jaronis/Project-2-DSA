#include <iostream>
#include <queue>
#include <vector>
#include <fstream>
#include <sstream>
using namespace std;

class TreeNode {
public:
    string name;
    string id;
    int popularity;
    int duration_ms;
    int isExplicit; // 0 no, 1 yes
    vector<string> artists;
    vector<string> artistIDs;
    string releaseDate;
    float danceability;
    float energy;
    int key;
    float loudness;
    int mode; // 0 minor, 1 major
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
             int isExplicit = 0, vector<string> artists = {}, vector<string> artistIDs = {},
             string releaseDate = "", float danceability = 0.0f, float energy = 0.0f,
             int key = 0, float loudness = 0.0f, int mode = 0, float speechiness = 0.0f,
             float acousticness = 0.0f, float instrumentalness = 0.0f, float liveness = 0.0f,
             float valence = 0.0f, float tempo = 0.0f, int time_signature = 4)
        : name(name), id(id), popularity(popularity), duration_ms(duration_ms), 
          isExplicit(isExplicit), artists(artists), artistIDs(artistIDs), releaseDate(releaseDate),
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
        if (!root){
            root = newNode;
            return;
        }

        TreeNode* curr = root;
        TreeNode* parent = nullptr;

        while (curr) {
            parent = curr;
            if (newNode->name < curr->name)
                curr = curr->left;
            else
                curr = curr->right;
        }   

        if (newNode->name < parent->name)
            parent->left = newNode;
        else
            parent->right = newNode;
    }

    vector<TreeNode*> dfs() {
        vector<TreeNode*> result;
        dfsHelper(root, result);
        return result;
    }

    vector<TreeNode*> bfs() {
        vector<TreeNode*> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            TreeNode* node = q.front();
            q.pop();
            result.push_back(node);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        return result;
    }

    void printTree() {
        vector<TreeNode*> nodes = dfs();
        for (TreeNode* node : nodes) {
            cout << "Name: " << node->name << ", ID: " << node->id 
                 << ", Popularity: " << node->popularity 
                 << ", Duration: " << node->duration_ms << "ms"
                 << ", Explicit: " << node->isExplicit << endl;
            cout << "Artists: ";
            for (auto& a : node->artists) cout << a << " ";
            cout << "\nRelease Date: " << node->releaseDate << "\n---\n";
        }
    }
};

int main() {
    
}
