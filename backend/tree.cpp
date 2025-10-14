#include <iostream>
#include <queue>
#include <stack>
#include <vector>
using namespace std;

class TreeNode {
public:
    int val;
    TreeNode* left;
    TreeNode* right;

    TreeNode(int value) : val(value), left(nullptr), right(nullptr){}
};

class BinaryTree {
private:
    TreeNode* root;

    void dfsHelper(TreeNode* node, vector<int>& result){
        if (!node){
            return;
        } 
        dfsHelper(node->left, result);
        result.push_back(node->val);
        dfsHelper(node->right, result);
    }

public:
    BinaryTree() : root(nullptr) {}

    void insert(int value){
        TreeNode* newNode = new TreeNode(value);

        if (!root){
            root = newNode;
            return;
        }

        TreeNode* curr = root;
        TreeNode* parent = nullptr;

        while (curr) {
            parent = curr;
            if (value < curr->val)
                curr = curr->left;
            else
                curr = curr->right;
        }   

        if (value < parent->val)
            parent->left = newNode;
        else
            parent->right = newNode;
    }

    vector<int> dfs() {
        vector<int> result;
        dfsHelper(root, result);
        return result;
    }

    vector<int> bfs() {
        vector<int> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            TreeNode* node = q.front();
            q.pop();
            result.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        return result;
    }
};

int main() {
    BinaryTree tree;
    tree.insert(5);
    tree.insert(3);
    tree.insert(7);
    tree.insert(2);
    tree.insert(4);
    tree.insert(6);
    tree.insert(8);

    vector<int> dfsResult = tree.dfs();
    cout << "DFS (in-order): ";
    for (int val : dfsResult) cout << val << " ";
    cout << endl;

    vector<int> bfsResult = tree.bfs();
    cout << "BFS (level-order): ";
    for (int val : bfsResult) cout << val << " ";
    cout << endl;

    return 0;
}