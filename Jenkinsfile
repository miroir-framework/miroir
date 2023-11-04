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
              sh 'cp -r /var/jenkins_home/workspace/miroir-standalone-app-ci /home/tmp'
              sh 'ls /home/tmp'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm install'
              // sh 'npm link -w miroir-core'
              // sh 'npm link -w miroir-redux'
              // sh 'npm link -w miroir-store-indexedDb'
              // sh 'npm link -w miroir-store-postgres'
            }
        }
        stage('Build') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && chmod 777 ./link_packages.sh'
              sh 'cd /home/tmp/miroir-standalone-app-ci && ./link_packages.sh'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-standalone-app'
            }
        }
    }
}