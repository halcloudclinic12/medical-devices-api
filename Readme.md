## Git branches merging

main => create new => feature_branch

feature_branch => merged to => dev

dev => merged to => main

main => merged to => stage
     => merged to => production

## Node version

```18.x or better```

Use nvm to manage node versions

## Server software setup

Amazon Linux 2023:

   ```
   1. Update linux
      sudo apt-get update -y
      sudo apt-get install -y libpangocairo-1.0-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libgconf-2-4 libasound2 libatk1.0-0 libgtk-3-0 libgbm-dev

   2. Install nginx
      sudo apt-get install nginx
      
      Setup it as reverse proxy:

      sudo nano /etc/nginx/nginx.conf

      Add following code:

      server {
        listen       80;
        listen       [::]:80;
        server_name  ec2-your-server.compute-1.amazonaws.com;

        location / {
         proxy_pass http://localhost:3000;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
        }
      }
   
      Also increase allowed upload file size for nginx

      http {
         ...
         client_max_body_size 20M;
         ...
      }


   3. Install nodejs and nvm
      sudo apt-get install nodejs

      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
      nvm install --lts
      nvm use --lts

      npm install pm2 -g

   4. Install git
      sudo apt-get install git

   5. Setup aws cli
      https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

      Add your credentials in following file:
      ~/.aws/credentials

   6. Verify installations
      node -v
      npm -v
      pm2 -v
      git --version
      aws --version
   ```

## Setup mongodb

   Install mongodb
      https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-amazon/

      If you want to connect to mongodb from your local pc, do this:

      a. sudo nano /etc/mongodb.conf
      b. Create admin user
```
   db.createUser({
      user: "your_user",
      pwd: "your_password",
      roles: [
        { role: "userAdminAnyDatabase", db: "admin" },
        { role: "readWriteAnyDatabase", db: "admin" }
      ]
   });

   mongosh -u your_user -p your_password --authenticationDatabase admin
```

      c. Update security
         security:
           authorization: enabled

      Note: If you encounter openssl error like this:

```
   mongosh: OpenSSL configuration error:
   40A85B6A297F0000:error:030000A9:digital envelope routines:alg_module_init:unknown option:…/deps/openssl/openssl/crypto/evp/evp_cnf.c:61:name=rh-allow-sha1-signatures, value=yes
```

      Then run following command:

      `sudo dnf swap mongodb-mongosh mongodb-mongosh-shared-openssl3`

   To allow nodejs instance to connect with mongodb instance (both on different lightsail instances):

   a. Add nodejs ip address to custom tcp of mongodb for port 27017.
   b. Add mongodb private ip in `bindIp` of `/etc/mongodb.conf`
   c. Restart mongodb `sudo systemctl restart mongod`

## Setting up environment

1. Make a copy of `.env.example` and name it `.env`
2. Update CORS, Database, AWS etc.:

   Run these commands first time:

```
   npm install
   npm run build
   node dist/seeder/init.js
```

   To generate test data

```
   npm run seed:summary
```

   Run server:

```
   pm2 start dist/server.js
   pm2 restart 0 && pm2 flush && pm2 logs
```

## Auto backup of database to S3

   Copy content of script `backup_db_to_s3.sh` on mongodb instance.
   Install aws cli and configure access keys.
   Create a file named `config.env` in same directory as `backup_db_to_s3.sh` and set variables:

```
   MONGO_URI="mongodb://username:password@localhost:27017/clayartistsdb?authSource=admin"
   DB_NAME="clayartistsdb"
   BACKUP_DIR="mongo_backup"
   S3_BUCKET="clayartists-db"
   S3_FOLDER="backups"
```

   Create directory `db_backup_logs` and `mongo_backup` in same directory as `backup_db_to_s3.sh`.

   Add following cron to take backup every hour:

   `0 * * * * /path/to/backup_db_to_s3.sh /path/to/db_backup_logs/backup.log 2>&1`

## Build docker image

To build docker image, run following command:

```
   docker build -t username/image-name:tag-name .
   docker push username/image-name:tag-name
```

On linux/mac

```
   sh builddocker.sh tag-name
```

## Run stack on local with docker-compose

Use .env.docker in this case.

```
   docker-compose up --build
```

## Running github pipleline

   Check .github/workflows/deploy.yml file in project directory and create following variables in repository:

   ```Repository -> Settings > Secrets and variables > Actions -> Secrets```

   Add a new environment named `dev` and add variables there.
   Create following variables:

   - PM2_PATH
   - PROJECT_DIRECTORY
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - LIGHTSAIL_DEV_HOST
   - LIGHTSAIL_DEV_SSH_PRIVATE_KEY
   - LIGHTSAIL_USER

   To allow github access lightsail instance, perform following steps:

   Create private/public (RSA) key on lightsail instance 
   Copy the id_rsa.pub (public key) file content to authorized keys `~/.ssh/authorized_keys`
   Copy id_rsa (private key) content to LIGHTSAIL_DEV_SSH_PRIVATE_KEY on github

## Allow git pull without password

   To allow git pull without username, follow these steps:

   - Create ssh key on light sail and add public key to github account `Settings => SSH and GPT keys => New SSH key`

   - Set git pull to use ssh instead of https in project root directory

   `git remote set-url origin git@github.com:ashutoshpandey/healthbox-api.git`

## Setting letsencrypt for server

```
   sudo apt install certbot -y
   sudo systemctl stop nginx
   sudo certbot certonly --standalone -d stage-api.clayartists.org
```   

   Certbot will create and store the SSL certificates in:

   `/etc/letsencrypt/live/stage-api.clayartists.org/`

   Now add following in `nginx.conf`

   `sudo nano /etc/nginx/nginx.conf`   

   Add following lines in `server{ }` section

```
server {
    listen 443 ssl;
    server_name stage-api.clayartists.org;

    ssl_certificate /etc/letsencrypt/live/stage-api.clayartists.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stage-api.clayartists.org/privkey.pem;

    location / {
      ...
    }
}    

server {
    listen 80;
    server_name stage-api.clayartists.org;
    return 301 https://$host$request_uri;
}
```

   Finally restart nginx

   `sudo systemctl start nginx`

   To automate renewal daily (it will actually renew when required):

```
   sudo crontab -e
   0 2 * * * certbot renew --quiet && systemctl reload nginx
```

## To run server manually 

```
pm2 start current/dist/start.js --name "healthbox-api"
```

## To run sonar qube scanner

1. Create a new project in sonar qube

   http://localhost:9000

2. Generate token by going to:

```
   My account -> Security -> Generate Tokens   
```

Give it a name and choose `Project Analysis Token` in `Type`
Update values in `sonar-project.properties`

3. To run scanner from the root of the project

```
 npx @sonar/scan -- "-Dsonar.host.url=http://localhost:9000" "-Dsonar.token=sqp_token-value"
```

## To run on kubernetes (Mac)

In a separate terminal, run following:

```
sudo minikube tunnel
```

For local testing, add following entry:

```
minikube ip
sudo nano /etc/hosts
```

Add your IP entry with host name like this:

```
127.0.0.1   healthbox-api.test
```

Next, create namespace in kubernetes for application:

```
kubectl create namespace healthbox-api
```

To allow Kubernetes to download images from dockerhub

```
kubectl -n healthbox-api create secret docker-registry dockerhub-cred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=<your-dockerhub-username> \
  --docker-password=<your-dockerhub-password> \
  --docker-email=<your-email>
```

Create secrets like this

```
kubectl create secret generic mongo-auth \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=mongoadmin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD=supersecret \
  -n healthbox-api
```

Setup pods

```
kubectl apply -f k8s/
```

Get status of nodes

```
kubectl get all -n healthbox-api
```

Check issues with images

```
kubectl -n healthbox-api get deploy node-api -o jsonpath='{.spec.template.spec.containers[0].image}'; echo
kubectl -n healthbox-api describe pod -l app=node-api | sed -n '/Events:/,$p'
```

If there are dependency issues with api, run:

```
kubectl apply -f k8s/api.yaml
```

Restart deployment

```
kubectl rollout restart deployment/node-api -n healthbox-api
```

Get the secrets like this

```
kubectl get secrets -n healthbox-api
```

Check one secret, ex: mongo-auth

```
kubectl get secret mongo-auth -n healthbox-api -o yaml
```

Decode specific key

```
kubectl get secret mongo-auth -n healthbox-api \
  -o jsonpath='{.data.MONGO_INITDB_ROOT_USERNAME}' | base64 --decode
echo
kubectl get secret mongo-auth -n healthbox-api \
  -o jsonpath='{.data.MONGO_INITDB_ROOT_PASSWORD}' | base64 --decode
```

Reset existing secret

```
kubectl delete secret mongo-auth -n healthbox-api
kubectl create secret generic mongo-auth \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=mongoadmin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD=newSuperSecret123 \
  -n healthbox-api
```

Refresh pods with new values:

```
kubectl rollout restart deployment/node-api -n healthbox-api
```

To see logs of a pod:

```
kubectl -n healthbox-api get pods -l app=node-api
```

Get pod name and use in:

```
kubectl -n healthbox-api logs <POD_NAME> -c node-api --tail=200
```