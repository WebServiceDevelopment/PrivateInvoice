-- MariaDB dump 10.19  Distrib 10.5.13-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: Seller_450
-- ------------------------------------------------------
-- Server version	10.5.13-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `buyer_document`
--

DROP TABLE IF EXISTS `buyer_document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `buyer_document` (
  `document_uuid` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `document_json` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_currency` varchar(8) COLLATE utf8_unicode_ci DEFAULT 'ETH',
  `settlement_hash` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_time` datetime DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `buyer_document_archive`
--

DROP TABLE IF EXISTS `buyer_document_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `buyer_document_archive` (
  `document_uuid` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `document_json` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_currency` varchar(8) COLLATE utf8_unicode_ci DEFAULT 'ETH',
  `settlement_hash` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_time` datetime DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `buyer_status`
--

DROP TABLE IF EXISTS `buyer_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `buyer_status` (
  `document_uuid` varchar(100) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `document_number` varchar(36) NOT NULL,
  `document_folder` varchar(36) NOT NULL,
  `seller_uuid` varchar(100) NOT NULL,
  `seller_membername` varchar(255) DEFAULT NULL,
  `seller_organization` varchar(255) DEFAULT NULL,
  `seller_archived` int(11) NOT NULL DEFAULT 0,
  `seller_last_action` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `buyer_uuid` varchar(100) DEFAULT NULL,
  `buyer_membername` varchar(255) DEFAULT NULL,
  `buyer_organization` varchar(255) DEFAULT NULL,
  `buyer_archived` int(11) NOT NULL DEFAULT 0,
  `buyer_last_action` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_from` varchar(36) DEFAULT NULL,
  `root_document` varchar(36) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_on` datetime DEFAULT NULL,
  `opened` int(11) NOT NULL DEFAULT 0,
  `subject_line` varchar(255) DEFAULT NULL,
  `due_by` date DEFAULT NULL,
  `amount_due` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `buyer_status_archive`
--

DROP TABLE IF EXISTS `buyer_status_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `buyer_status_archive` (
  `document_uuid` varchar(100) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `document_number` varchar(36) NOT NULL,
  `document_folder` varchar(36) NOT NULL,
  `seller_uuid` varchar(100) NOT NULL,
  `seller_membername` varchar(255) DEFAULT NULL,
  `seller_organization` varchar(255) DEFAULT NULL,
  `seller_archived` int(11) NOT NULL DEFAULT 0,
  `seller_last_action` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `buyer_uuid` varchar(100) NOT NULL,
  `buyer_membername` varchar(255) DEFAULT NULL,
  `buyer_organization` varchar(255) DEFAULT NULL,
  `buyer_archived` int(11) NOT NULL DEFAULT 0,
  `buyer_last_action` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_from` varchar(36) DEFAULT NULL,
  `root_document` varchar(36) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_on` datetime DEFAULT NULL,
  `opened` int(11) NOT NULL DEFAULT 0,
  `subject_line` varchar(255) DEFAULT NULL,
  `due_by` date DEFAULT NULL,
  `amount_due` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contacts` (
  `_id` varchar(36) NOT NULL,
  `invite_code` varchar(36) NOT NULL,
  `local_member_uuid` varchar(36) NOT NULL,
  `local_membername` varchar(255) NOT NULL,
  `remote_origin` varchar(255) NOT NULL,
  `remote_member_uuid` varchar(36) NOT NULL,
  `remote_membername` varchar(255) NOT NULL,
  `remote_organization` text NOT NULL,
  `local_to_remote` tinyint(4) NOT NULL,
  `remote_to_local` tinyint(4) NOT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_on` datetime DEFAULT NULL,
  PRIMARY KEY (`_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_profile_img`
--

DROP TABLE IF EXISTS `dat_profile_img`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dat_profile_img` (
  `avatar_uuid` varchar(100) NOT NULL,
  `img_data` blob NOT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`avatar_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_profile_stamp`
--

DROP TABLE IF EXISTS `dat_profile_stamp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dat_profile_stamp` (
  `stamp_uuid` varchar(100) NOT NULL,
  `img_data` blob NOT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`stamp_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invite`
--

DROP TABLE IF EXISTS `invite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invite` (
  `invite_code` varchar(16) NOT NULL,
  `local_member_uuid` varchar(100) NOT NULL,
  `rel_buyer` int(11) NOT NULL DEFAULT 0,
  `rel_seller` int(11) NOT NULL DEFAULT 0,
  `use_count` int(11) NOT NULL DEFAULT 0,
  `max_count` int(11) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_on` datetime DEFAULT NULL,
  `removed_on` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `members` (
  `member_uuid` varchar(100) NOT NULL,
  `membername` varchar(255) NOT NULL,
  `work_email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `avatar_uuid` varchar(100) NOT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `logo_uuid` varchar(100) NOT NULL,
  `organization_name` varchar(255) NOT NULL,
  `organization_postcode` varchar(255) DEFAULT NULL,
  `organization_address` varchar(255) DEFAULT NULL,
  `organization_building` varchar(255) DEFAULT NULL,
  `organization_department` varchar(255) DEFAULT NULL,
  `organization_tax_id` varchar(32) DEFAULT NULL,
  `wallet_address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`member_uuid`) USING BTREE,
  UNIQUE KEY `username` (`membername`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `organization_img`
--

DROP TABLE IF EXISTS `organization_img`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_img` (
  `logo_uuid` varchar(100) NOT NULL,
  `img_data` blob NOT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`logo_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seller_document`
--

DROP TABLE IF EXISTS `seller_document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_document` (
  `document_uuid` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `document_json` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_currency` varchar(8) COLLATE utf8_unicode_ci DEFAULT 'ETH',
  `settlement_hash` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_time` datetime DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seller_document_archive`
--

DROP TABLE IF EXISTS `seller_document_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_document_archive` (
  `document_uuid` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `document_json` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_currency` varchar(8) COLLATE utf8_unicode_ci DEFAULT 'ETH',
  `settlement_hash` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `settlement_time` datetime DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seller_document_draft`
--

DROP TABLE IF EXISTS `seller_document_draft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_document_draft` (
  `document_uuid` varchar(100) NOT NULL,
  `document_json` text DEFAULT NULL,
  `document_type` varchar(50) NOT NULL,
  `subject_line` varchar(255) NOT NULL DEFAULT '',
  `currency_options` text DEFAULT NULL,
  `seller_uuid` varchar(100) NOT NULL,
  `seller_membername` varchar(255) DEFAULT NULL,
  `seller_details` text DEFAULT NULL,
  `buyer_uuid` varchar(100) DEFAULT NULL,
  `buyer_membername` varchar(255) DEFAULT NULL,
  `buyer_details` text DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `document_meta` text DEFAULT NULL,
  `document_body` text DEFAULT NULL,
  `document_totals` text DEFAULT NULL,
  `document_logo` text DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seller_status`
--

DROP TABLE IF EXISTS `seller_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_status` (
  `document_uuid` varchar(100) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `document_number` varchar(36) NOT NULL,
  `document_folder` varchar(36) NOT NULL,
  `seller_uuid` varchar(100) NOT NULL,
  `seller_membername` varchar(255) DEFAULT NULL,
  `seller_organization` varchar(255) DEFAULT NULL,
  `seller_archived` int(11) NOT NULL DEFAULT 0,
  `seller_last_action` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `buyer_uuid` varchar(100) DEFAULT NULL,
  `buyer_membername` varchar(255) DEFAULT NULL,
  `buyer_organization` varchar(255) DEFAULT NULL,
  `buyer_archived` int(11) NOT NULL DEFAULT 0,
  `buyer_last_action` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_from` varchar(36) DEFAULT NULL,
  `root_document` varchar(36) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_on` datetime DEFAULT NULL,
  `opened` int(11) NOT NULL DEFAULT 0,
  `subject_line` varchar(255) DEFAULT NULL,
  `due_by` date DEFAULT NULL,
  `amount_due` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seller_status_archive`
--

DROP TABLE IF EXISTS `seller_status_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_status_archive` (
  `document_uuid` varchar(100) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `document_number` varchar(36) NOT NULL,
  `document_folder` varchar(36) NOT NULL,
  `seller_uuid` varchar(100) NOT NULL,
  `seller_membername` varchar(255) DEFAULT NULL,
  `seller_organization` varchar(255) DEFAULT NULL,
  `seller_archived` int(11) NOT NULL DEFAULT 0,
  `seller_last_action` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `buyer_uuid` varchar(100) NOT NULL,
  `buyer_membername` varchar(255) DEFAULT NULL,
  `buyer_organization` varchar(255) DEFAULT NULL,
  `buyer_archived` int(11) NOT NULL DEFAULT 0,
  `buyer_last_action` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_from` varchar(36) DEFAULT NULL,
  `root_document` varchar(36) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_on` datetime DEFAULT NULL,
  `opened` int(11) NOT NULL DEFAULT 0,
  `subject_line` varchar(255) DEFAULT NULL,
  `due_by` date DEFAULT NULL,
  `amount_due` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `seller_status_draft`
--

DROP TABLE IF EXISTS `seller_status_draft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_status_draft` (
  `document_uuid` varchar(100) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `document_number` varchar(36) NOT NULL,
  `document_folder` varchar(36) NOT NULL,
  `seller_uuid` varchar(100) NOT NULL,
  `seller_membername` varchar(255) DEFAULT NULL,
  `seller_organization` varchar(255) DEFAULT NULL,
  `seller_archived` int(11) NOT NULL DEFAULT 0,
  `seller_last_action` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `buyer_uuid` varchar(100) DEFAULT NULL,
  `buyer_membername` varchar(255) DEFAULT NULL,
  `buyer_organization` varchar(255) DEFAULT NULL,
  `buyer_archived` int(11) NOT NULL DEFAULT 0,
  `buyer_last_action` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_from` varchar(36) DEFAULT NULL,
  `root_document` varchar(36) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_on` datetime DEFAULT NULL,
  `opened` int(11) NOT NULL DEFAULT 0,
  `subject_line` varchar(255) DEFAULT NULL,
  `due_by` date DEFAULT NULL,
  `amount_due` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`document_uuid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-05-29 10:36:02