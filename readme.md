{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint"
      ]
    }
  ],
  "emulators": {
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": false,
      "port": 4000
    },
    "singleProjectMode": true,
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "database": {
      "port": 9000
    },
    "hosting": {
      "port": 5000
    },
    "pubsub": {
      "port": 8085
    },
    "storage": {
      "port": 9199
    },
    "eventarc": {
      "port": 9299
    },
    "dataconnect": {
      "port": 9399
    }
  }
}
