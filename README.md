# PrivateInvoice

Private Invoice is a 
P2P based invoicing system where anyone can create their own Node
or join a managed Node in order to manage their own keys, assets,
and financial records.

### 🔥🔥🔥🔥🔥🔥 WARNING!!!!! 🔥🔥🔥🔥🔥

Private Invoice is still a work in progress, it does not include best practices
for security. Also the data format is still subject to change which will require
data to be migrated. If you create a Node, only use it for testing with fake data. 


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
