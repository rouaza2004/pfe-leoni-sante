-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: pfe_sante
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounts_collaborateur`
--

DROP TABLE IF EXISTS `accounts_collaborateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_collaborateur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `matricule` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actif` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `site_id` bigint DEFAULT NULL,
  `adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `departement` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poste` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`),
  KEY `accounts_collaborateur_site_id_865cab2f_fk_accounts_site_id` (`site_id`),
  CONSTRAINT `accounts_collaborateur_site_id_865cab2f_fk_accounts_site_id` FOREIGN KEY (`site_id`) REFERENCES `accounts_site` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_collaborateur`
--

LOCK TABLES `accounts_collaborateur` WRITE;
/*!40000 ALTER TABLE `accounts_collaborateur` DISABLE KEYS */;
INSERT INTO `accounts_collaborateur` VALUES (1,'EMP001','Masmoudi','Rania','emp001@test.com',1,'2026-02-24 23:52:33.285762',1,NULL,NULL,NULL,NULL,NULL,NULL),(2,'EMP002','Trabelsi','Sarra','emp002@test.com',0,'2026-02-24 23:52:33.308356',1,NULL,NULL,NULL,NULL,NULL,NULL),(3,'EMP003','Khelifi','Sarra','emp003@test.com',1,'2026-02-24 23:52:33.315447',1,NULL,NULL,NULL,NULL,NULL,NULL),(4,'EMP004','Gharbi','Omar','emp004@test.com',1,'2026-02-24 23:52:33.320971',1,NULL,NULL,NULL,NULL,NULL,NULL),(5,'EMP005','Ayadi','Sarra','emp005@test.com',1,'2026-02-24 23:52:33.326512',1,NULL,NULL,NULL,NULL,NULL,NULL),(6,'EMP006','Ayadi','Omar','emp006@test.com',1,'2026-02-24 23:52:33.334117',1,NULL,NULL,NULL,NULL,NULL,NULL),(7,'EMP007','Trabelsi','Ahmed','emp007@test.com',1,'2026-02-24 23:52:33.339645',1,NULL,NULL,NULL,NULL,NULL,NULL),(8,'EMP008','Trabelsi','Ahmed','emp008@test.com',1,'2026-02-24 23:52:33.345162',1,NULL,NULL,NULL,NULL,NULL,NULL),(9,'EMP009','Jaziri','Mahdi','emp009@test.com',1,'2026-02-24 23:52:33.350621',1,NULL,NULL,NULL,NULL,NULL,NULL),(10,'EMP010','Jaziri','Nour','emp010@test.com',1,'2026-02-24 23:52:33.358344',1,NULL,NULL,NULL,NULL,NULL,NULL),(11,'EMP011','Gharbi','Nour','emp011@test.com',0,'2026-02-24 23:52:33.365950',1,NULL,NULL,NULL,NULL,NULL,NULL),(12,'EMP012','Gharbi','Rania','emp012@test.com',1,'2026-02-24 23:52:33.370950',1,NULL,NULL,NULL,NULL,NULL,NULL),(13,'EMP013','Khelifi','Mariem','emp013@test.com',1,'2026-02-24 23:52:33.375481',1,NULL,NULL,NULL,NULL,NULL,NULL),(14,'EMP014','Khelifi','Ahmed','emp014@test.com',1,'2026-02-24 23:52:33.381079',1,NULL,NULL,NULL,NULL,NULL,NULL),(15,'EMP015','Jaziri','Sarra','emp015@test.com',1,'2026-02-24 23:52:33.386094',1,NULL,NULL,NULL,NULL,NULL,NULL),(16,'EMP016','Ayadi','Yassine','emp016@test.com',1,'2026-02-24 23:52:33.391198',1,NULL,NULL,NULL,NULL,NULL,NULL),(17,'EMP017','Hammami','Nour','emp017@test.com',1,'2026-02-24 23:52:33.397427',1,NULL,NULL,NULL,NULL,NULL,NULL),(18,'EMP018','Hammami','Yassine','emp018@test.com',1,'2026-02-24 23:52:33.403529',1,NULL,NULL,NULL,NULL,NULL,NULL),(19,'EMP019','Khelifi','Rania','emp019@test.com',0,'2026-02-24 23:52:33.409217',1,NULL,NULL,NULL,NULL,NULL,NULL),(20,'EMP020','Trabelsi','Yassine','emp020@test.com',0,'2026-02-24 23:52:33.413736',1,NULL,NULL,NULL,NULL,NULL,NULL),(21,'EMP021','Ben Ali','Omar','emp021@test.com',0,'2026-02-24 23:52:33.418752',1,NULL,NULL,NULL,NULL,NULL,NULL),(22,'EMP022','Trabelsi','Omar','emp022@test.com',1,'2026-02-24 23:52:33.424266',1,NULL,NULL,NULL,NULL,NULL,NULL),(23,'EMP023','Hammami','Yassine','emp023@test.com',1,'2026-02-24 23:52:33.429277',1,NULL,NULL,NULL,NULL,NULL,NULL),(24,'EMP024','Gharbi','Ahmed','emp024@test.com',1,'2026-02-24 23:52:33.434801',1,NULL,NULL,NULL,NULL,NULL,NULL),(25,'EMP025','Ayadi','Mahdi','emp025@test.com',1,'2026-02-24 23:52:33.439806',1,NULL,NULL,NULL,NULL,NULL,NULL),(26,'EMP026','Ayadi','Nour','emp026@test.com',1,'2026-02-24 23:52:33.445335',1,NULL,NULL,NULL,NULL,NULL,NULL),(27,'EMP027','Trabelsi','Ahmed','emp027@test.com',1,'2026-02-24 23:52:33.451330',1,NULL,NULL,NULL,NULL,NULL,NULL),(28,'EMP028','Ayadi','Sarra','emp028@test.com',1,'2026-02-24 23:52:33.457870',1,NULL,NULL,NULL,NULL,NULL,NULL),(29,'EMP029','Jaziri','Mahdi','emp029@test.com',1,'2026-02-24 23:52:33.463870',1,NULL,NULL,NULL,NULL,NULL,NULL),(30,'EMP030','Masmoudi','Mariem','emp030@test.com',1,'2026-02-24 23:52:33.472388',1,NULL,NULL,NULL,NULL,NULL,NULL),(31,'EMP031','Jaziri','Sarra','emp031@test.com',1,'2026-02-24 23:52:33.478253',1,NULL,NULL,NULL,NULL,NULL,NULL),(32,'EMP032','Jaziri','Mahdi','emp032@test.com',1,'2026-02-24 23:52:33.484925',1,NULL,NULL,NULL,NULL,NULL,NULL),(33,'EMP033','Ben Ali','Nour','emp033@test.com',1,'2026-02-24 23:52:33.491948',1,NULL,NULL,NULL,NULL,NULL,NULL),(34,'EMP034','Ben Ali','Sarra','emp034@test.com',1,'2026-02-24 23:52:33.498462',1,NULL,NULL,NULL,NULL,NULL,NULL),(35,'EMP035','Ben Ali','Mahdi','emp035@test.com',1,'2026-02-24 23:52:33.503990',1,NULL,NULL,NULL,NULL,NULL,NULL),(36,'EMP036','Ben Ali','Mariem','emp036@test.com',1,'2026-02-24 23:52:33.510185',1,NULL,NULL,NULL,NULL,NULL,NULL),(37,'EMP037','Masmoudi','Sarra','emp037@test.com',1,'2026-02-24 23:52:33.516735',1,NULL,NULL,NULL,NULL,NULL,NULL),(38,'EMP038','Gharbi','Sarra','emp038@test.com',1,'2026-02-24 23:52:33.521278',1,NULL,NULL,NULL,NULL,NULL,NULL),(39,'EMP039','Ben Ali','Yassine','emp039@test.com',1,'2026-02-24 23:52:33.527805',1,NULL,NULL,NULL,NULL,NULL,NULL),(40,'EMP040','Masmoudi','Omar','emp040@test.com',0,'2026-02-24 23:52:33.533315',1,NULL,NULL,NULL,NULL,NULL,NULL),(41,'EMP041','Jaziri','Rania','emp041@test.com',1,'2026-02-24 23:52:33.539944',1,NULL,NULL,NULL,NULL,NULL,NULL),(42,'EMP042','Gharbi','Omar','emp042@test.com',1,'2026-02-24 23:52:33.548485',1,NULL,NULL,NULL,NULL,NULL,NULL),(43,'EMP043','Gharbi','Omar','emp043@test.com',0,'2026-02-24 23:52:33.554008',1,NULL,NULL,NULL,NULL,NULL,NULL),(44,'EMP044','Khelifi','Omar','emp044@test.com',1,'2026-02-24 23:52:33.560442',1,NULL,NULL,NULL,NULL,NULL,NULL),(45,'EMP045','Jaziri','Sarra','emp045@test.com',0,'2026-02-24 23:52:33.566982',1,NULL,NULL,NULL,NULL,NULL,NULL),(46,'EMP046','Ben Ali','Omar','emp046@test.com',1,'2026-02-24 23:52:33.574020',1,NULL,NULL,NULL,NULL,NULL,NULL),(47,'EMP047','Jaziri','Rania','emp047@test.com',1,'2026-02-24 23:52:33.579024',1,NULL,NULL,NULL,NULL,NULL,NULL),(48,'EMP048','Khelifi','Yassine','emp048@test.com',1,'2026-02-24 23:52:33.585859',1,NULL,NULL,NULL,NULL,NULL,NULL),(49,'EMP049','Hammami','Mahdi','emp049@test.com',0,'2026-02-24 23:52:33.591377',1,NULL,NULL,NULL,NULL,NULL,NULL),(50,'EMP050','Gharbi','Mariem','emp050@test.com',1,'2026-02-24 23:52:33.598008',1,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `accounts_collaborateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts_site`
--

DROP TABLE IF EXISTS `accounts_site`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_site` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `localite` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_site`
--

LOCK TABLES `accounts_site` WRITE;
/*!40000 ALTER TABLE `accounts_site` DISABLE KEYS */;
INSERT INTO `accounts_site` VALUES (1,'LEONI','Menzel Hayet');
/*!40000 ALTER TABLE `accounts_site` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts_user`
--

DROP TABLE IF EXISTS `accounts_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_user`
--

LOCK TABLES `accounts_user` WRITE;
/*!40000 ALTER TABLE `accounts_user` DISABLE KEYS */;
INSERT INTO `accounts_user` VALUES (1,'pbkdf2_sha256$1000000$pt418KuVXLldbmIsAtcnba$a6dPcXc5OiCgh92W0JFPfJd6K6dBs58nit9nj7jwRd0=','2026-03-07 02:48:43.995042',1,'admin','','','roua.zanina@gmail.com',1,1,'2026-02-21 01:38:55.871610','ADMIN'),(2,'pbkdf2_sha256$1000000$gtOOwbwcDV6Or7CWuP9MWh$UuAR1tRtc4VMVlMTmtV89AU/kgh0eausknPuAq5m9Zk=',NULL,0,'traitant','','','',0,1,'2026-02-23 01:44:12.000000','MEDECIN_TRAITANT'),(3,'pbkdf2_sha256$1000000$Yilmtn5yVZYHqUiZQVNPEU$qDhZALohjvSzwB8Ck8Yrxiu+nsdWQY+KXaVJgqbFbPA=',NULL,0,'medecin-travail','','','',0,1,'2026-02-23 14:41:31.348600','MEDECIN_TRAVAIL'),(4,'pbkdf2_sha256$1000000$gdhgH6BOYHaX19uPjYD38f$ifdurAjVmGAwhdu9uIUhCHJeDEg5LGPgMaAIKwrO78A=',NULL,0,'medecin-controleur','','','',0,1,'2026-02-23 14:42:37.387217','MEDECIN_CONTROLEUR'),(5,'pbkdf2_sha256$1000000$RWzpsMiERwwlMhMZGZLRW5$WRkSJO7SaXxYNIK2K07bKkJIyGmQSVzc0TvXChOvjiU=',NULL,0,'infirmier','','','',0,1,'2026-02-23 14:43:29.000000','INFIRMIER'),(6,'pbkdf2_sha256$1000000$GwRAMS3STH6W8s5ym8oTnV$Sc/Ii7mun6Msl/PSrt8VwVXCsiyylB7XmmdwdzUy5yc=',NULL,0,'RESPONSABLE_RH','','','',0,1,'2026-02-23 14:44:00.934872','RESPONSABLE_RH'),(7,'pbkdf2_sha256$1000000$AQ7ryj2bEiQeF75gi3soKM$DypeCOrpwXqrDeRy1pUuOWA0mQkg4PtyGwAYnuHBGBU=',NULL,0,'AGENT_HSEE','','','',0,1,'2026-02-23 14:44:43.914760','AGENT_HSEE');
/*!40000 ALTER TABLE `accounts_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts_user_groups`
--

DROP TABLE IF EXISTS `accounts_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_user_groups_user_id_group_id_59c0b32f_uniq` (`user_id`,`group_id`),
  KEY `accounts_user_groups_group_id_bd11a704_fk_auth_group_id` (`group_id`),
  CONSTRAINT `accounts_user_groups_group_id_bd11a704_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `accounts_user_groups_user_id_52b62117_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_user_groups`
--

LOCK TABLES `accounts_user_groups` WRITE;
/*!40000 ALTER TABLE `accounts_user_groups` DISABLE KEYS */;
INSERT INTO `accounts_user_groups` VALUES (1,2,1);
/*!40000 ALTER TABLE `accounts_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts_user_user_permissions`
--

DROP TABLE IF EXISTS `accounts_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_user_user_permi_user_id_permission_id_2ab516c2_uniq` (`user_id`,`permission_id`),
  KEY `accounts_user_user_p_permission_id_113bb443_fk_auth_perm` (`permission_id`),
  CONSTRAINT `accounts_user_user_p_permission_id_113bb443_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `accounts_user_user_p_user_id_e4f0a161_fk_accounts_` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_user_user_permissions`
--

LOCK TABLES `accounts_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `accounts_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments_appointment`
--

DROP TABLE IF EXISTS `appointments_appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments_appointment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type_medecin` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `heure` time(6) NOT NULL,
  `motif` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `appointments_appoint_collaborateur_id_2e7a88f6_fk_accounts_` (`collaborateur_id`),
  CONSTRAINT `appointments_appoint_collaborateur_id_2e7a88f6_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments_appointment`
--

LOCK TABLES `appointments_appointment` WRITE;
/*!40000 ALTER TABLE `appointments_appointment` DISABLE KEYS */;
INSERT INTO `appointments_appointment` VALUES (1,'TRAVAIL','2026-02-02','08:00:00.000000','visite d\'embauche','PREVU','2026-03-06 05:55:42.026586',26);
/*!40000 ALTER TABLE `appointments_appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
INSERT INTO `auth_group` VALUES (1,'MEDECIN_TRAITANT');
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add user',6,'add_user'),(22,'Can change user',6,'change_user'),(23,'Can delete user',6,'delete_user'),(24,'Can view user',6,'view_user'),(25,'Can add collaborateur',7,'add_collaborateur'),(26,'Can change collaborateur',7,'change_collaborateur'),(27,'Can delete collaborateur',7,'delete_collaborateur'),(28,'Can view collaborateur',7,'view_collaborateur'),(29,'Can add ordonnance',8,'add_ordonnance'),(30,'Can change ordonnance',8,'change_ordonnance'),(31,'Can delete ordonnance',8,'delete_ordonnance'),(32,'Can view ordonnance',8,'view_ordonnance'),(33,'Can add fiche medicale',9,'add_fichemedicale'),(34,'Can change fiche medicale',9,'change_fichemedicale'),(35,'Can delete fiche medicale',9,'delete_fichemedicale'),(36,'Can view fiche medicale',9,'view_fichemedicale'),(37,'Can add certificat medical',10,'add_certificatmedical'),(38,'Can change certificat medical',10,'change_certificatmedical'),(39,'Can delete certificat medical',10,'delete_certificatmedical'),(40,'Can view certificat medical',10,'view_certificatmedical'),(41,'Can add dossier medical',11,'add_dossiermedical'),(42,'Can change dossier medical',11,'change_dossiermedical'),(43,'Can delete dossier medical',11,'delete_dossiermedical'),(44,'Can view dossier medical',11,'view_dossiermedical'),(45,'Can add accident travail',12,'add_accidenttravail'),(46,'Can change accident travail',12,'change_accidenttravail'),(47,'Can delete accident travail',12,'delete_accidenttravail'),(48,'Can view accident travail',12,'view_accidenttravail'),(49,'Can add examen initial',13,'add_exameninitial'),(50,'Can change examen initial',13,'change_exameninitial'),(51,'Can delete examen initial',13,'delete_exameninitial'),(52,'Can view examen initial',13,'view_exameninitial'),(53,'Can add examen ulterieur',14,'add_examenulterieur'),(54,'Can change examen ulterieur',14,'change_examenulterieur'),(55,'Can delete examen ulterieur',14,'delete_examenulterieur'),(56,'Can view examen ulterieur',14,'view_examenulterieur'),(57,'Can add maladie professionnelle',15,'add_maladieprofessionnelle'),(58,'Can change maladie professionnelle',15,'change_maladieprofessionnelle'),(59,'Can delete maladie professionnelle',15,'delete_maladieprofessionnelle'),(60,'Can view maladie professionnelle',15,'view_maladieprofessionnelle'),(61,'Can add poste travail',16,'add_postetravail'),(62,'Can change poste travail',16,'change_postetravail'),(63,'Can delete poste travail',16,'delete_postetravail'),(64,'Can view poste travail',16,'view_postetravail'),(65,'Can add vaccination',17,'add_vaccination'),(66,'Can change vaccination',17,'change_vaccination'),(67,'Can delete vaccination',17,'delete_vaccination'),(68,'Can view vaccination',17,'view_vaccination'),(69,'Can add site',18,'add_site'),(70,'Can change site',18,'change_site'),(71,'Can delete site',18,'delete_site'),(72,'Can view site',18,'view_site'),(73,'Can add rendez vous',19,'add_rendezvous'),(74,'Can change rendez vous',19,'change_rendezvous'),(75,'Can delete rendez vous',19,'delete_rendezvous'),(76,'Can view rendez vous',19,'view_rendezvous'),(77,'Can add appointment',20,'add_appointment'),(78,'Can change appointment',20,'change_appointment'),(79,'Can delete appointment',20,'delete_appointment'),(80,'Can view appointment',20,'view_appointment'),(81,'Can add stock item',21,'add_stockitem'),(82,'Can change stock item',21,'change_stockitem'),(83,'Can delete stock item',21,'delete_stockitem'),(84,'Can view stock item',21,'view_stockitem'),(85,'Can add stock movement',22,'add_stockmovement'),(86,'Can change stock movement',22,'change_stockmovement'),(87,'Can delete stock movement',22,'delete_stockmovement'),(88,'Can view stock movement',22,'view_stockmovement'),(89,'Can add incident infirmier',23,'add_incidentinfirmier'),(90,'Can change incident infirmier',23,'change_incidentinfirmier'),(91,'Can delete incident infirmier',23,'delete_incidentinfirmier'),(92,'Can view incident infirmier',23,'view_incidentinfirmier'),(93,'Can add plan action hsee',24,'add_planactionhsee'),(94,'Can change plan action hsee',24,'change_planactionhsee'),(95,'Can delete plan action hsee',24,'delete_planactionhsee'),(96,'Can view plan action hsee',24,'view_planactionhsee'),(97,'Can add demande examen labo',25,'add_demandeexamenlabo'),(98,'Can change demande examen labo',25,'change_demandeexamenlabo'),(99,'Can delete demande examen labo',25,'delete_demandeexamenlabo'),(100,'Can view demande examen labo',25,'view_demandeexamenlabo'),(101,'Can add examen complementaire',26,'add_examencomplementaire'),(102,'Can change examen complementaire',26,'change_examencomplementaire'),(103,'Can delete examen complementaire',26,'delete_examencomplementaire'),(104,'Can view examen complementaire',26,'view_examencomplementaire'),(105,'Can add fiche aptitude',27,'add_ficheaptitude'),(106,'Can change fiche aptitude',27,'change_ficheaptitude'),(107,'Can delete fiche aptitude',27,'delete_ficheaptitude'),(108,'Can view fiche aptitude',27,'view_ficheaptitude');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_accounts_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (1,'2026-02-23 01:44:13.716172','2','traitant - ',1,'[{\"added\": {}}]',6,1),(2,'2026-02-23 14:41:32.008571','3','medecin-travail - MEDECIN_TRAVAIL',1,'[{\"added\": {}}]',6,1),(3,'2026-02-23 14:42:38.103165','4','medecin-controleur - MEDECIN_CONTROLEUR',1,'[{\"added\": {}}]',6,1),(4,'2026-02-23 14:43:30.028442','5','infirmier - INFIRMIER',1,'[{\"added\": {}}]',6,1),(5,'2026-02-23 14:44:01.609561','6','RESPONSABLE_RH - RESPONSABLE_RH',1,'[{\"added\": {}}]',6,1),(6,'2026-02-23 14:44:44.584668','7','AGENT_HSEE - HSEE',1,'[{\"added\": {}}]',6,1),(7,'2026-03-01 16:35:45.645584','1','MEDECIN_TRAITANT',1,'[{\"added\": {}}]',3,1),(8,'2026-03-01 16:37:24.740338','2','traitant',2,'[{\"changed\": {\"fields\": [\"Groups\"]}}]',6,1),(9,'2026-03-04 07:28:31.224389','1','LEONI - Menzel Hayet',1,'[{\"added\": {}}]',18,1),(10,'2026-03-04 07:39:40.482673','50','EMP050 - Gharbi Mariem',2,'[{\"changed\": {\"fields\": [\"Site\"]}}]',7,1),(11,'2026-03-04 07:41:04.658971','50','EMP050 - Gharbi Mariem',2,'[]',7,1),(12,'2026-03-04 07:49:11.994636','50','EMP050 - Gharbi Mariem',2,'[]',7,1),(13,'2026-03-06 01:33:45.497969','5','infirmier (INFIRMIER)',2,'[]',6,1);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (7,'accounts','collaborateur'),(18,'accounts','site'),(6,'accounts','user'),(1,'admin','logentry'),(20,'appointments','appointment'),(19,'appointments','rendezvous'),(3,'auth','group'),(2,'auth','permission'),(4,'contenttypes','contenttype'),(12,'medical','accidenttravail'),(10,'medical','certificatmedical'),(25,'medical','demandeexamenlabo'),(11,'medical','dossiermedical'),(26,'medical','examencomplementaire'),(13,'medical','exameninitial'),(14,'medical','examenulterieur'),(27,'medical','ficheaptitude'),(9,'medical','fichemedicale'),(23,'medical','incidentinfirmier'),(15,'medical','maladieprofessionnelle'),(8,'medical','ordonnance'),(24,'medical','planactionhsee'),(16,'medical','postetravail'),(21,'medical','stockitem'),(22,'medical','stockmovement'),(17,'medical','vaccination'),(5,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-02-21 01:35:51.308757'),(2,'contenttypes','0002_remove_content_type_name','2026-02-21 01:35:51.435144'),(3,'auth','0001_initial','2026-02-21 01:35:51.794004'),(4,'auth','0002_alter_permission_name_max_length','2026-02-21 01:35:51.923415'),(5,'auth','0003_alter_user_email_max_length','2026-02-21 01:35:51.930857'),(6,'auth','0004_alter_user_username_opts','2026-02-21 01:35:51.938981'),(7,'auth','0005_alter_user_last_login_null','2026-02-21 01:35:51.948444'),(8,'auth','0006_require_contenttypes_0002','2026-02-21 01:35:51.956667'),(9,'auth','0007_alter_validators_add_error_messages','2026-02-21 01:35:51.961938'),(10,'auth','0008_alter_user_username_max_length','2026-02-21 01:35:51.969009'),(11,'auth','0009_alter_user_last_name_max_length','2026-02-21 01:35:51.976610'),(12,'auth','0010_alter_group_name_max_length','2026-02-21 01:35:51.995096'),(13,'auth','0011_update_proxy_permissions','2026-02-21 01:35:52.003647'),(14,'auth','0012_alter_user_first_name_max_length','2026-02-21 01:35:52.010649'),(15,'accounts','0001_initial','2026-02-21 01:35:52.492780'),(16,'admin','0001_initial','2026-02-21 01:35:52.746314'),(17,'admin','0002_logentry_remove_auto_add','2026-02-21 01:35:52.753875'),(18,'admin','0003_logentry_add_action_flag_choices','2026-02-21 01:35:52.763036'),(19,'sessions','0001_initial','2026-02-21 01:35:52.816659'),(20,'accounts','0002_collaborateur_remove_user_actif_and_more','2026-02-23 15:47:03.355509'),(22,'medical','0001_initial','2026-03-01 03:35:23.846680'),(23,'accounts','0003_site_collaborateur_site','2026-03-04 07:17:56.671066'),(24,'accounts','0004_alter_collaborateur_site','2026-03-04 07:37:06.589128'),(25,'appointments','0001_initial','2026-03-06 05:26:41.992666'),(26,'appointments','0002_appointment_delete_rendezvous','2026-03-06 05:53:04.395410'),(27,'medical','0002_stockitem_stockmovement','2026-03-06 06:19:48.502277'),(28,'medical','0003_accidenttravail_circonstances_and_more','2026-03-06 19:56:35.211458'),(29,'medical','0004_accidenttravail_gravite_accidenttravail_segment_and_more','2026-03-06 23:42:11.109844'),(30,'medical','0005_dossiermedical_alcool_and_more','2026-03-08 06:46:51.566946'),(31,'accounts','0005_collaborateur_adresse_collaborateur_cin_and_more','2026-03-08 07:35:39.286465'),(32,'medical','0006_remove_examenulterieur_audition_and_more','2026-03-08 08:22:25.430134');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('6jhjjos9o9fow022i01jqml5eqibyqey','.eJxVjEEOwiAQRe_C2pCCMIBL9z0DGYZBqoYmpV0Z765NutDtf-_9l4i4rTVunZc4ZXERSpx-t4T04LaDfMd2myXNbV2mJHdFHrTLcc78vB7u30HFXr81g6HivTPswZ5tMahC4AEVOu1KAghgLQ-GLBULBlImTeQwaXJKaxbvD9qNN-M:1vtbym:se7ujYdd5mfWB2NVC9ylroPDrqmtbC9kkWVIvdv1ERs','2026-03-07 01:40:20.794394'),('nuzocmiant9dbvcs4yuaeg6i20zilmx8','.eJxVjEEOwiAQRe_C2pCCMIBL9z0DGYZBqoYmpV0Z765NutDtf-_9l4i4rTVunZc4ZXERSpx-t4T04LaDfMd2myXNbV2mJHdFHrTLcc78vB7u30HFXr81g6HivTPswZ5tMahC4AEVOu1KAghgLQ-GLBULBlImTeQwaXJKaxbvD9qNN-M:1vyhie:sqwSLUfGWcm_kMiT0fewfZ_DIvgWpN1zVyatDiOplrg','2026-03-21 02:48:44.001577');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_accidenttravail`
--

DROP TABLE IF EXISTS `medical_accidenttravail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_accidenttravail` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_accident` date NOT NULL,
  `cause` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `nature_lesion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `siege_lesion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duree_arret` int DEFAULT NULL,
  `ipp` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dossier_id` bigint NOT NULL,
  `circonstances` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  `envoye_hsee` tinyint(1) NOT NULL,
  `heure_accident` time(6) DEFAULT NULL,
  `lieu_accident` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temoin1_matricule` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temoin1_nom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temoin1_telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temoin2_matricule` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temoin2_nom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temoin2_telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transport_hopital` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gravite` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `segment` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut_enquete` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_accidenttrav_dossier_id_b19140c5_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_accidenttrav_dossier_id_b19140c5_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_accidenttravail`
--

LOCK TABLES `medical_accidenttravail` WRITE;
/*!40000 ALTER TABLE `medical_accidenttravail` DISABLE KEYS */;
INSERT INTO `medical_accidenttravail` VALUES (1,'2026-03-01','Sol glissant','Entorse','Cheville droite',3,'0%',7,'Le collaborateur a glissé sur une zone humide près du poste de travail','2026-03-07 01:08:24.421311',1,'09:00:00.000000','Atelier câblage','EMP045','Ahmed Ben Ali','22123456','','','','Non',NULL,NULL,'TERMINEE'),(2,'2026-03-02','Manipulation outil tranchant','Coupure profonde','Main gauche',12,'5%',5,'Le collaborateur s\'est blessé lors d\'une opération de maintenance sur un équipement','2026-03-07 01:15:56.961388',1,'10:15:00.000000','Maintenance','','Walid Gharbi','21555666','','','','Ambulance',NULL,NULL,'TERMINEE'),(3,'2026-01-06','Mauvaise manutention','Lombalgie','Dos',7,'0%',28,'Le collaborateur a soulevé une charge lourde avec une mauvaise posture.','2026-03-07 01:23:21.570690',1,'10:00:00.000000','Zone logistique','','Nadia Cherif','20111222','','','','Non',NULL,NULL,'TERMINEE');
/*!40000 ALTER TABLE `medical_accidenttravail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_certificatmedical`
--

DROP TABLE IF EXISTS `medical_certificatmedical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_certificatmedical` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `nb_jours_repos` int unsigned NOT NULL,
  `date_debut_repos` date DEFAULT NULL,
  `contenu` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `created_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_certificatme_collaborateur_id_022a0181_fk_accounts_` (`collaborateur_id`),
  KEY `medical_certificatme_created_by_id_f153b43b_fk_accounts_` (`created_by_id`),
  CONSTRAINT `medical_certificatme_collaborateur_id_022a0181_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`),
  CONSTRAINT `medical_certificatme_created_by_id_f153b43b_fk_accounts_` FOREIGN KEY (`created_by_id`) REFERENCES `accounts_user` (`id`),
  CONSTRAINT `medical_certificatmedical_chk_1` CHECK ((`nb_jours_repos` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_certificatmedical`
--

LOCK TABLES `medical_certificatmedical` WRITE;
/*!40000 ALTER TABLE `medical_certificatmedical` DISABLE KEYS */;
INSERT INTO `medical_certificatmedical` VALUES (1,'2026-03-05',5,'2026-02-15','','2026-03-05 01:34:25.220209',25,2),(2,'2026-03-05',4,'2015-12-20','','2026-03-05 03:24:08.857534',25,2),(3,'2026-03-06',5,'2026-03-02','','2026-03-06 21:14:49.069522',25,2);
/*!40000 ALTER TABLE `medical_certificatmedical` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_demandeexamenlabo`
--

DROP TABLE IF EXISTS `medical_demandeexamenlabo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_demandeexamenlabo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_prenom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gsm` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entreprise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poste_travail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `renseignements_cliniques` longtext COLLATE utf8mb4_unicode_ci,
  `glycemie` tinyint(1) NOT NULL,
  `creatinine` tinyint(1) NOT NULL,
  `nfs` tinyint(1) NOT NULL,
  `vs` tinyint(1) NOT NULL,
  `transaminases` tinyint(1) NOT NULL,
  `acide_urique` tinyint(1) NOT NULL,
  `triglycerides` tinyint(1) NOT NULL,
  `cholesterol` tinyint(1) NOT NULL,
  `examen_selles` tinyint(1) NOT NULL,
  `date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `created_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_demandeexame_collaborateur_id_13bd5916_fk_accounts_` (`collaborateur_id`),
  KEY `medical_demandeexame_created_by_id_6272c9da_fk_accounts_` (`created_by_id`),
  CONSTRAINT `medical_demandeexame_collaborateur_id_13bd5916_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`),
  CONSTRAINT `medical_demandeexame_created_by_id_6272c9da_fk_accounts_` FOREIGN KEY (`created_by_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_demandeexamenlabo`
--

LOCK TABLES `medical_demandeexamenlabo` WRITE;
/*!40000 ALTER TABLE `medical_demandeexamenlabo` DISABLE KEYS */;
INSERT INTO `medical_demandeexamenlabo` VALUES (1,'Ayadi Mahdi','','','','LEONI','','',0,0,0,1,0,0,0,0,0,'2026-03-08','2026-03-08 07:11:54.823317',25,3);
/*!40000 ALTER TABLE `medical_demandeexamenlabo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_dossiermedical`
--

DROP TABLE IF EXISTS `medical_dossiermedical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_dossiermedical` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `alcool` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `antecedents_chirurgicaux` longtext COLLATE utf8mb4_unicode_ci,
  `antecedents_gynecologiques` longtext COLLATE utf8mb4_unicode_ci,
  `antecedents_heredofamiliaux` longtext COLLATE utf8mb4_unicode_ci,
  `antecedents_medicaux` longtext COLLATE utf8mb4_unicode_ci,
  `automedication` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_recrutement` date DEFAULT NULL,
  `niveau_etudes_diplomes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poste_travail_actuel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profession` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tabac` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `collaborateur_id` (`collaborateur_id`),
  CONSTRAINT `medical_dossiermedic_collaborateur_id_99cf8982_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_dossiermedical`
--

LOCK TABLES `medical_dossiermedical` WRITE;
/*!40000 ALTER TABLE `medical_dossiermedical` DISABLE KEYS */;
INSERT INTO `medical_dossiermedical` VALUES (1,'LEONI','Menzel Hayet','2026-03-04 06:58:21.348313',25,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,NULL,NULL,'2026-03-04 07:02:18.876878',7,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,NULL,NULL,'2026-03-04 07:21:10.112980',26,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,NULL,NULL,'2026-03-04 07:38:40.149751',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,NULL,NULL,'2026-03-04 07:40:58.050283',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,NULL,NULL,'2026-03-04 07:57:33.394054',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,NULL,NULL,'2026-03-04 07:57:52.380887',35,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,'LEONI','Menzel Hayet','2026-03-06 19:03:37.217205',5,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,'LEONI','Menzel Hayet','2026-03-06 19:03:37.295350',16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,'LEONI','Menzel Hayet','2026-03-06 19:03:37.434870',46,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,'LEONI','Menzel Hayet','2026-03-06 19:03:37.469126',36,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,'LEONI','Menzel Hayet','2026-03-06 19:03:37.475583',33,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,'LEONI','Menzel Hayet','2026-03-06 19:03:37.497863',34,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,'LEONI','Menzel Hayet','2026-03-06 19:03:37.561959',39,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,'LEONI','Menzel Hayet','2026-03-06 19:03:37.642761',24,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(16,'LEONI','Menzel Hayet','2026-03-06 19:03:37.677621',21,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,'LEONI','Menzel Hayet','2026-03-06 19:03:37.750986',43,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,'LEONI','Menzel Hayet','2026-03-06 19:03:37.795408',11,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,'LEONI','Menzel Hayet','2026-03-06 19:03:37.835007',42,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,'LEONI','Menzel Hayet','2026-03-06 19:03:37.874751',12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(21,'LEONI','Menzel Hayet','2026-03-06 19:03:37.943291',49,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(22,'LEONI','Menzel Hayet','2026-03-06 19:03:37.945831',4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(23,'LEONI','Menzel Hayet','2026-03-06 19:03:38.013350',38,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(24,'LEONI','Menzel Hayet','2026-03-06 19:03:38.081284',23,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(25,'LEONI','Menzel Hayet','2026-03-06 19:03:38.100630',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(26,'LEONI','Menzel Hayet','2026-03-06 19:03:38.130656',18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(27,'LEONI','Menzel Hayet','2026-03-06 19:03:38.168704',29,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(28,'LEONI','Menzel Hayet','2026-03-06 19:03:38.175126',32,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(29,'LEONI','Menzel Hayet','2026-03-06 19:03:38.189984',9,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(30,'LEONI','Menzel Hayet','2026-03-06 19:03:38.303876',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(31,'LEONI','Menzel Hayet','2026-03-06 19:03:38.309511',41,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(32,'LEONI','Menzel Hayet','2026-03-06 19:03:38.318324',14,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(33,'LEONI','Menzel Hayet','2026-03-06 19:03:38.342272',47,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(34,'LEONI','Menzel Hayet','2026-03-06 19:03:38.350117',15,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(35,'LEONI','Menzel Hayet','2026-03-06 19:03:38.377520',31,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(36,'LEONI','Menzel Hayet','2026-03-06 19:03:38.467475',45,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(37,'LEONI','Menzel Hayet','2026-03-06 19:03:38.485757',19,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(38,'LEONI','Menzel Hayet','2026-03-06 19:03:38.497859',13,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(39,'LEONI','Menzel Hayet','2026-03-06 19:03:38.498861',44,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(40,'LEONI','Menzel Hayet','2026-03-06 19:03:38.559559',30,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(41,'LEONI','Menzel Hayet','2026-03-06 19:03:38.571557',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(42,'LEONI','Menzel Hayet','2026-03-06 19:03:38.615696',48,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(43,'LEONI','Menzel Hayet','2026-03-06 19:03:38.622184',40,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(44,'LEONI','Menzel Hayet','2026-03-06 19:03:38.645348',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(45,'LEONI','Menzel Hayet','2026-03-06 19:03:38.678653',37,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(46,'LEONI','Menzel Hayet','2026-03-06 19:03:38.758068',8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(47,'LEONI','Menzel Hayet','2026-03-06 19:03:38.760076',27,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(48,'LEONI','Menzel Hayet','2026-03-06 19:03:38.765655',22,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(49,'LEONI','Menzel Hayet','2026-03-06 19:03:38.838281',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(50,'LEONI','Menzel Hayet','2026-03-06 19:03:38.867011',20,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `medical_dossiermedical` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_examencomplementaire`
--

DROP TABLE IF EXISTS `medical_examencomplementaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_examencomplementaire` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_prenom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poste_travail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entreprise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `renseignements_cliniques` longtext COLLATE utf8mb4_unicode_ci,
  `visiotest` tinyint(1) NOT NULL,
  `audiogramme` tinyint(1) NOT NULL,
  `ecg` tinyint(1) NOT NULL,
  `efr` tinyint(1) NOT NULL,
  `date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `created_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_examencomple_collaborateur_id_4b3e1d59_fk_accounts_` (`collaborateur_id`),
  KEY `medical_examencomple_created_by_id_43d4ed39_fk_accounts_` (`created_by_id`),
  CONSTRAINT `medical_examencomple_collaborateur_id_4b3e1d59_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`),
  CONSTRAINT `medical_examencomple_created_by_id_43d4ed39_fk_accounts_` FOREIGN KEY (`created_by_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_examencomplementaire`
--

LOCK TABLES `medical_examencomplementaire` WRITE;
/*!40000 ALTER TABLE `medical_examencomplementaire` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_examencomplementaire` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_exameninitial`
--

DROP TABLE IF EXISTS `medical_exameninitial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_exameninitial` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `medecin_nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_examen` date NOT NULL,
  `poids` double DEFAULT NULL,
  `taille` double DEFAULT NULL,
  `tension_arterielle` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pouls` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conclusion` longtext COLLATE utf8mb4_unicode_ci,
  `dossier_id` bigint NOT NULL,
  `abdomen` longtext COLLATE utf8mb4_unicode_ci,
  `appareil_cardio_vasculaire` longtext COLLATE utf8mb4_unicode_ci,
  `appareil_genito_urinaire` longtext COLLATE utf8mb4_unicode_ci,
  `appareil_locomoteur` longtext COLLATE utf8mb4_unicode_ci,
  `appareil_respiratoire` longtext COLLATE utf8mb4_unicode_ci,
  `aptitude` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audition_od` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audition_og` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `denture` longtext COLLATE utf8mb4_unicode_ci,
  `examens_complementaires` longtext COLLATE utf8mb4_unicode_ci,
  `glandes_endocrines` longtext COLLATE utf8mb4_unicode_ci,
  `precision_aptitude` longtext COLLATE utf8mb4_unicode_ci,
  `resultat_examen` longtext COLLATE utf8mb4_unicode_ci,
  `systeme_nerveux` longtext COLLATE utf8mb4_unicode_ci,
  `teguments` longtext COLLATE utf8mb4_unicode_ci,
  `vision_od_loin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vision_od_pres` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vision_og_loin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vision_og_pres` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dossier_id` (`dossier_id`),
  CONSTRAINT `medical_exameninitia_dossier_id_3954b270_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_exameninitial`
--

LOCK TABLES `medical_exameninitial` WRITE;
/*!40000 ALTER TABLE `medical_exameninitial` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_exameninitial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_examenulterieur`
--

DROP TABLE IF EXISTS `medical_examenulterieur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_examenulterieur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type_examen` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `medecin_nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `poste_travail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poids` double DEFAULT NULL,
  `taille` double DEFAULT NULL,
  `conclusion` longtext COLLATE utf8mb4_unicode_ci,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_examenulteri_dossier_id_e0b0ac49_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_examenulteri_dossier_id_e0b0ac49_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_examenulterieur`
--

LOCK TABLES `medical_examenulterieur` WRITE;
/*!40000 ALTER TABLE `medical_examenulterieur` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_examenulterieur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_ficheaptitude`
--

DROP TABLE IF EXISTS `medical_ficheaptitude`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_ficheaptitude` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entreprise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse_entreprise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nature_activite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_cnss` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom_prenom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_lieu_naissance` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse_travailleur` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnss_travailleur` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualifications_professionnelles` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_recrutement` date DEFAULT NULL,
  `poste_travail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_examen` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aptitude` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recommandations` longtext COLLATE utf8mb4_unicode_ci,
  `date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `created_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_ficheaptitud_collaborateur_id_be4b5d5b_fk_accounts_` (`collaborateur_id`),
  KEY `medical_ficheaptitude_created_by_id_cb51bcbd_fk_accounts_user_id` (`created_by_id`),
  CONSTRAINT `medical_ficheaptitud_collaborateur_id_be4b5d5b_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`),
  CONSTRAINT `medical_ficheaptitude_created_by_id_cb51bcbd_fk_accounts_user_id` FOREIGN KEY (`created_by_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_ficheaptitude`
--

LOCK TABLES `medical_ficheaptitude` WRITE;
/*!40000 ALTER TABLE `medical_ficheaptitude` DISABLE KEYS */;
INSERT INTO `medical_ficheaptitude` VALUES (1,'LEONI','Zone Industrielle Menzel Hayet, Monastir','Fabrication de câblage automobile','CNSS-LEONI-45872','Ayadi Mahdi','15/04/1998 - Monastir','Rue Habib Bourguiba, Menzel Hayet, Monastir','CNSS-TRAV-2026-00125','Technicien en maintenance industrielle','2026-03-01','Technicien maintenance ligne de production','EMBAUCHE','APTE','Apte au poste de technicien maintenance.\nPort obligatoire des EPI.\nSurveillance médicale périodique recommandée.\nÉviter le port de charges lourdes de manière prolongée.','2026-03-08','2026-03-08 09:52:06.222357',25,3),(2,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-08','2026-03-08 09:52:35.937161',25,3),(3,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-09','2026-03-09 08:50:29.379239',25,3),(4,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-09','2026-03-09 09:13:13.683344',25,3),(5,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-09','2026-03-09 09:13:27.562558',25,3);
/*!40000 ALTER TABLE `medical_ficheaptitude` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_fichemedicale`
--

DROP TABLE IF EXISTS `medical_fichemedicale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_fichemedicale` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `collaborateur_id` (`collaborateur_id`),
  CONSTRAINT `medical_fichemedical_collaborateur_id_eaebd5d7_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_fichemedicale`
--

LOCK TABLES `medical_fichemedicale` WRITE;
/*!40000 ALTER TABLE `medical_fichemedicale` DISABLE KEYS */;
INSERT INTO `medical_fichemedicale` VALUES (1,'1990-03-12','sousse','sousse MSAKEN','54041532','2026-03-05 01:33:56.991900','2026-03-10 10:19:37.894611',25),(2,NULL,'','','','2026-03-05 03:25:33.267431','2026-03-05 03:25:33.267431',6),(3,NULL,'','','','2026-03-06 01:40:59.591586','2026-03-06 01:40:59.591586',28);
/*!40000 ALTER TABLE `medical_fichemedicale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_incidentinfirmier`
--

DROP TABLE IF EXISTS `medical_incidentinfirmier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_incidentinfirmier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_incident` date NOT NULL,
  `heure_incident` time(6) NOT NULL,
  `segment` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poste_occupe` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mode_lesion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_causal` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `infirmier_responsable` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarque` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_incidentinfi_dossier_id_4cce80a9_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_incidentinfi_dossier_id_4cce80a9_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_incidentinfirmier`
--

LOCK TABLES `medical_incidentinfirmier` WRITE;
/*!40000 ALTER TABLE `medical_incidentinfirmier` DISABLE KEYS */;
INSERT INTO `medical_incidentinfirmier` VALUES (1,'2026-02-02','09:00:00.000000','Neo','MH1','Operatrice','traumatisme','contact','54041531','rabeb','physiol+coner gel','2026-03-06 20:41:56.477906',12);
/*!40000 ALTER TABLE `medical_incidentinfirmier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_maladieprofessionnelle`
--

DROP TABLE IF EXISTS `medical_maladieprofessionnelle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_maladieprofessionnelle` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_maladie` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_causal` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_tableau` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_decouverte` date NOT NULL,
  `duree_arret` int DEFAULT NULL,
  `ipp` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_maladieprofe_dossier_id_3e3f9980_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_maladieprofe_dossier_id_3e3f9980_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_maladieprofessionnelle`
--

LOCK TABLES `medical_maladieprofessionnelle` WRITE;
/*!40000 ALTER TABLE `medical_maladieprofessionnelle` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_maladieprofessionnelle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_ordonnance`
--

DROP TABLE IF EXISTS `medical_ordonnance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_ordonnance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `contenu` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `created_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_ordonnance_collaborateur_id_ee5222d7_fk_accounts_` (`collaborateur_id`),
  KEY `medical_ordonnance_created_by_id_f8cef9bc_fk_accounts_user_id` (`created_by_id`),
  CONSTRAINT `medical_ordonnance_collaborateur_id_ee5222d7_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`),
  CONSTRAINT `medical_ordonnance_created_by_id_f8cef9bc_fk_accounts_user_id` FOREIGN KEY (`created_by_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_ordonnance`
--

LOCK TABLES `medical_ordonnance` WRITE;
/*!40000 ALTER TABLE `medical_ordonnance` DISABLE KEYS */;
INSERT INTO `medical_ordonnance` VALUES (1,'2026-03-05','PARACETAMOL','2026-03-05 03:24:45.018484',25,2);
/*!40000 ALTER TABLE `medical_ordonnance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_planactionhsee`
--

DROP TABLE IF EXISTS `medical_planactionhsee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_planactionhsee` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `zone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `risque` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `responsable` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delai` date DEFAULT NULL,
  `statut` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `accident_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_planactionhs_accident_id_6b2a1cee_fk_medical_a` (`accident_id`),
  CONSTRAINT `medical_planactionhs_accident_id_6b2a1cee_fk_medical_a` FOREIGN KEY (`accident_id`) REFERENCES `medical_accidenttravail` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_planactionhsee`
--

LOCK TABLES `medical_planactionhsee` WRITE;
/*!40000 ALTER TABLE `medical_planactionhsee` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_planactionhsee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_postetravail`
--

DROP TABLE IF EXISTS `medical_postetravail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_postetravail` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `risque_professionnel` longtext COLLATE utf8mb4_unicode_ci,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_postetravail_dossier_id_c139bd6f_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_postetravail_dossier_id_c139bd6f_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_postetravail`
--

LOCK TABLES `medical_postetravail` WRITE;
/*!40000 ALTER TABLE `medical_postetravail` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_postetravail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_stockitem`
--

DROP TABLE IF EXISTS `medical_stockitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_stockitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_article` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` int unsigned NOT NULL,
  `seuil_critique` int unsigned NOT NULL,
  `unite` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `medical_stockitem_chk_1` CHECK ((`quantite` >= 0)),
  CONSTRAINT `medical_stockitem_chk_2` CHECK ((`seuil_critique` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_stockitem`
--

LOCK TABLES `medical_stockitem` WRITE;
/*!40000 ALTER TABLE `medical_stockitem` DISABLE KEYS */;
INSERT INTO `medical_stockitem` VALUES (1,'Paracétamol 500mg','MEDICAMENT',18,10,'boîtes','2026-03-06 06:20:23.702865'),(2,'Bétadine','MEDICAMENT',16,5,'flacons','2026-03-06 06:20:23.719222'),(3,'Compresses stériles','CONSOMMABLE',12,15,'paquets','2026-03-06 06:20:23.727784'),(4,'Aspirine 500mg','MEDICAMENT',9,5,'25','2026-03-06 06:56:07.611330'),(5,'Gants médicaux','CONSOMMABLE',0,15,'12','2026-03-06 06:58:20.902864'),(6,'Spasfon','MEDICAMENT',0,15,'27','2026-03-06 06:59:15.464449'),(7,'Amoxicilline 500mg','MEDICAMENT',40,10,'boîtes','2026-03-06 07:03:16.222655'),(8,'Panadol','MEDICAMENT',50,10,'boîtes','2026-03-06 07:04:23.311205'),(9,'Doliprane 1000mg','MEDICAMENT',60,10,'boîtes','2026-03-06 07:04:59.911481'),(10,'Compresses stériles','CONSOMMABLE',30,10,'paquets','2026-03-06 07:05:54.097624'),(11,'tanganil','MEDICAMENT',18,5,'boîtes','2026-03-10 10:22:39.751738');
/*!40000 ALTER TABLE `medical_stockitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_stockmovement`
--

DROP TABLE IF EXISTS `medical_stockmovement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_stockmovement` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type_mouvement` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` int unsigned NOT NULL,
  `remarque` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `stock_item_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_stockmovemen_stock_item_id_dd43a8b9_fk_medical_s` (`stock_item_id`),
  CONSTRAINT `medical_stockmovemen_stock_item_id_dd43a8b9_fk_medical_s` FOREIGN KEY (`stock_item_id`) REFERENCES `medical_stockitem` (`id`),
  CONSTRAINT `medical_stockmovement_chk_1` CHECK ((`quantite` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_stockmovement`
--

LOCK TABLES `medical_stockmovement` WRITE;
/*!40000 ALTER TABLE `medical_stockmovement` DISABLE KEYS */;
INSERT INTO `medical_stockmovement` VALUES (1,'ENTREE',12,'','2026-03-06 06:29:14.730108',2),(2,'SORTIE',1,'','2026-03-06 06:56:37.705610',4),(3,'SORTIE',2,'','2026-03-10 10:22:57.353675',11);
/*!40000 ALTER TABLE `medical_stockmovement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_vaccination`
--

DROP TABLE IF EXISTS `medical_vaccination`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_vaccination` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `vaccin` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_1` date DEFAULT NULL,
  `date_2` date DEFAULT NULL,
  `date_3` date DEFAULT NULL,
  `date_rappel` date DEFAULT NULL,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_vaccination_dossier_id_590dee88_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_vaccination_dossier_id_590dee88_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_vaccination`
--

LOCK TABLES `medical_vaccination` WRITE;
/*!40000 ALTER TABLE `medical_vaccination` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_vaccination` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-10 12:23:47
