# PrivateInvoice

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Private Invoice is a 
P2P based invoicing system where anyone can create their own Node
or join a managed Node in order to manage their own keys, assets,
and financial records.

### 🔥🔥🔥🔥🔥🔥 WARNING!!!!! 🔥🔥🔥🔥🔥🔥

Private Invoice is still a work in progress, it does not include best practices
for security. Also the data format is still subject to change which will require
data to be migrated. If you create a Node, only use it for testing with fake data. 

## Screenshots

Create Invoice, send to member on a different node.

![pstep_00](https://user-images.githubusercontent.com/5275924/169722398-4499ec31-717f-4e77-afc7-b59383d6d9b7.JPG)

Make payment on invoice.

![pstep_05](https://user-images.githubusercontent.com/5275924/169722466-e01e427b-c188-4c7b-985b-7b6cf34dbe1e.JPG)

See transaction details.

![pstep_06](https://user-images.githubusercontent.com/5275924/169722476-ab025113-2931-496b-9681-fd0644eed0fa.JPG)

## Install Instructions

Install instructions are provided for Ubuntu 20.04 x86_64 server as root. 
The application can be run on other Linux distrubutions, but no instructions 
are currently provided.

- Install Nodejs
- Install Ganache
- Install IPFS
- Install MariaDB
- Install Redis

### Install Nodejs

```
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
# source ~/.bashrc
# nvm install 16
# nvm use 16
# npm i pm2 -g
```

### Install Ganache

```
# npm i ganache -g
# screen -d -m ganache
```

### Install IPFS

```
# cd /tmp
# wget https://dist.ipfs.io/go-ipfs/v0.12.0/go-ipfs_v0.12.0_linux-amd64.tar.gz
# tar -xzf go-ipfs_v0.12.0_linux-amd64.tar.gz && cd go-ipfs
# bash install.sh
# sysctl -w net.core.rmem_max=2500000
# vim /lib/systemd/system/ipfs.service
--- Create File ---
[Unit]
Description=IPFS
After=network.target

[Service]
ExecStart=/usr/local/bin/ipfs daemon --migrate
Restart=always
User=root
Group=root
Restart=on-failure
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
--- EOF ---
# ipfs init
# systemctl daemon-reload
# systemctl enable ipfs
# systemctl start ipfs
```

### Install MariaDB

```
# apt update
# apt install mariadb-server
# systemctl start mariadb.service
# systemctl enable mariadb.service
# mysql_secure_installation
--- Start Prompt ---
Set root password? [Y/n] n
Remove anonymous users? [Y/n] Y
Disallow root login remotely? [Y/n] Y
Remove test database and access to it? [Y/n] Y
Reload privilege tables now? [Y/n] Y
--- End Prompt ---
# mysql
--- Start MariaDB ---
> CREATE DATABASE PrivateInvoice_dev;
> CREATE DATABASE PrivateInvoice_client;
> CREATE DATABASE PrivateInvoice_supply;
> CREATE USER pi_user@% IDENTIFIED BY `raspberry`;
> GRANT ALL ON PrivateInvoice_dev TO pi_user@%;
> GRANT ALL ON PrivateInvoice_client TO pi_user@%;
> GRANT ALL ON PrivateInvoice_supply TO pi_user@%;
> FLUSH PRIVILEGES
--- End MariaDB ---
```

### Install Redis

```
# apt install redis-server
# systemctl start redis.service
# systemctl enable redis.service
```


## Clone and Run

The next step is to clone and run the Private Invoice.
Most of the server configurations can be found in `config.json`
for currency format and database connections. 

We use `.env` files to allow for testing multiple instances on a
single server for testing interactions between Nodes.


```
# cd /opt
# git clone https://github.com/WebServiceDevelopment/PrivateInvoice.git
# cd PrivateInvoice
# npm i
# cd model
# mysql PrivateInvoice_dev < PrivateInvoice.sql
# mysql PrivateInvoice_client < PrivateInvoice.sql
# mysql PrivateInvoice_supply < PrivateInvoice.sql
# cd ..
# vim .env
--- Create File ---
SERVER_PORT=3000
DATABASE_NAME=PrivateInvoice_dev
--- EOF ---
# vim client.env
--- Create File ---
SERVER_PORT=3001
DATABASE_NAME=PrivateInvoice_client
--- EOF ---
# vim supply.env
--- Create File ---
SERVER_PORT=3002
DATABASE_NAME=PrivateInvoice_supply
--- EOF ---
```

From there, each of the three instances can be run with a script with:
```
# npm run dev
# npm num dev:client
# npm num dev:supply
```

Or start with pm2 to run in the background
```
# pm2 start npm -- dev
# pm2 start npm -- dev:client
# pm2 start npm -- dev:supply
```

From there the application will be available on port 3000, 3001, 3002

## Copyright

Copyright Web Service Development Inc. 2020-2022 Apache 2.0 License
