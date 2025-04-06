#include <iostream>
#include <filesystem>
#include <string>
#include <nlohmann/json.hpp>
#include <stdexcept>

namespace fs = std::filesystem;
using json = nlohmann::json;

const int MAX_DEPTH = 5;

bool shouldIgnore(const std::string& name) {
    static const std::vector<std::string> ignoreList = {
        "node_modules", ".git", "dist", "build", ".next", "coverage", ".cache"
    };
    return std::find(ignoreList.begin(), ignoreList.end(), name) != ignoreList.end();
}

json buildTree(const fs::path& path, int depth = 0) {
    if (depth > MAX_DEPTH || !fs::exists(path)) return json::array();

    json children = json::array();

    try {
        for (const auto& entry : fs::directory_iterator(path)) {
            std::string name = entry.path().filename().string();
            if (shouldIgnore(name)) continue;

            json node;
            node["name"] = name;
            node["path"] = entry.path().string();
            node["depth"] = depth;

            if (entry.is_directory()) {
                node["type"] = "folder";
                node["children"] = buildTree(entry.path(), depth + 1);
            } else {
                node["type"] = "file";
            }

            children.push_back(node);
        }
    } catch (const std::exception& e) {
        std::cerr << "Error reading directory: " << e.what() << std::endl;
    }

    return children;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: ./filetree <directory>" << std::endl;
        return 1;
    }

    fs::path root(argv[1]);
    if (!fs::exists(root)) {
        std::cerr << "Directory does not exist." << std::endl;
        return 1;
    }

    json result = buildTree(root);
    std::cout << result.dump();
    return 0;
}
