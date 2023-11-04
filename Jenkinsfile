pipeline {
    agent {
        docker {
            image 'miroir-ci-node:1.0' 
            args '-p 3000:3000' 
        }
    }
    stages {
        stage('Download libs') { 
            steps {
              sh 'env | sort'
              sh 'pwd'
              sh 'whoami'
              sh 'cp -r /home/workspace/miroir-app-ci-build /home/workspace/tmp'
              sh 'cd /home/workspace/tmp && npm install'
              // sh 'npm link -w miroir-core'
              // sh 'npm link -w miroir-redux'
              // sh 'npm link -w miroir-store-indexedDb'
              // sh 'npm link -w miroir-store-postgres'
            }
        }
        stage('Build') { 
            steps {
              sh 'cd /home/workspace/tmp && chmod 777 ./link_packages.sh'
              sh 'cd /home/workspace/tmp && ./link_packages.sh'
              sh 'cd /home/workspace/tmp && npm run build -w miroir-standalone-app'
            }
        }
    }
}