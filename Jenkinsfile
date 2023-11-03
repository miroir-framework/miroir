pipeline {
    agent {
        docker {
            image 'miroir-ci-jenkins-node:1.0' 
            args '-p 3000:3000' 
        }
    }
    stages {
        stage('Download libs') { 
            steps {
                sh 'env | sort'
                sh 'npm install'
                // sh 'npm link -w miroir-core'
                // sh 'npm link -w miroir-redux'
                // sh 'npm link -w miroir-store-indexedDb'
                // sh 'npm link -w miroir-store-postgres'
            }
        }
        stage('Build') { 
            steps {
                sh '/home/miroir-app-ci/jenkins/link_packages.sh'
                sh 'npm run build -w miroir-standalone-app'
            }
        }
    }
}