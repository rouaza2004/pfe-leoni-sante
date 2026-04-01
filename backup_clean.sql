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
INSERT INTO `accounts_collaborateur` VALUES (1,'1056538197','Masmoudi','Rania','emp001@test.com',1,'2026-02-24 23:52:33.285762',1,'Rue 01, Zone industrielle','34917781','1979-09-10','Qualit├⌐','Op├⌐rateur','29670650'),(2,'1750454108','Trabelsi','Sarra','emp002@test.com',0,'2026-02-24 23:52:33.308356',1,'Rue 01, Zone industrielle','73471970','1977-07-20','Production','Superviseur','26617709'),(3,'1793306901','Khelifi','Sarra','emp003@test.com',1,'2026-02-24 23:52:33.315447',1,'Rue 01, Zone industrielle','38719275','1988-02-21','Qualit├⌐','Technicien','26101643'),(4,'1694416700','Gharbi','Omar','emp004@test.com',1,'2026-02-24 23:52:33.320971',1,'Avenue Habib Bourguiba','48167696','1961-08-07','Qualit├⌐','Superviseur','27457318'),(5,'1683114407','Ayadi','Sarra','emp005@test.com',1,'2026-02-24 23:52:33.326512',1,'R├⌐sidence El Amal','54489523','1988-10-26','Qualit├⌐','Superviseur','23620781'),(6,'1056538198','Ayadi','Omar','emp006@test.com',1,'2026-02-24 23:52:33.334117',1,'Avenue Habib Bourguiba','37384385','1985-02-02','Qualit├⌐','Op├⌐rateur','27518673'),(7,'1750454109','Trabelsi','Ahmed','emp007@test.com',1,'2026-02-24 23:52:33.339645',1,'Avenue Habib Bourguiba','26606754','1988-11-18','RH','Op├⌐rateur','26110003'),(8,'1793306902','Trabelsi','Ahmed','emp008@test.com',1,'2026-02-24 23:52:33.345162',1,'Avenue Habib Bourguiba','61247764','1974-12-23','Production','Op├⌐rateur','23112970'),(9,'1694416701','Jaziri','Mahdi','emp009@test.com',1,'2026-02-24 23:52:33.350621',1,'R├⌐sidence El Amal','19534223','1974-04-01','RH','Technicien','21397916'),(10,'1683114408','Jaziri','Nour','emp010@test.com',1,'2026-02-24 23:52:33.358344',1,'R├⌐sidence El Amal','49603260','1988-03-12','Qualit├⌐','Op├⌐rateur','25260908'),(11,'1056538199','Gharbi','Nour','emp011@test.com',0,'2026-02-24 23:52:33.365950',1,'Rue 01, Zone industrielle','71362690','1967-06-07','RH','Agent qualit├⌐','21592474'),(12,'1750454110','Gharbi','Rania','emp012@test.com',1,'2026-02-24 23:52:33.370950',1,'Avenue Habib Bourguiba','29399001','1995-11-21','Qualit├⌐','Superviseur','25406769'),(13,'1793306903','Khelifi','Mariem','emp013@test.com',1,'2026-02-24 23:52:33.375481',1,'R├⌐sidence El Amal','88830725','1965-12-12','RH','Op├⌐rateur','22404595'),(14,'1694416702','Khelifi','Ahmed','emp014@test.com',1,'2026-02-24 23:52:33.381079',1,'Avenue Habib Bourguiba','43686756','1996-08-29','Maintenance','Superviseur','23017569'),(15,'1683114409','Jaziri','Sarra','emp015@test.com',1,'2026-02-24 23:52:33.386094',1,'R├⌐sidence El Amal','41164912','1975-09-20','Production','Superviseur','28188599'),(16,'1056538200','Ayadi','Yassine','emp016@test.com',1,'2026-02-24 23:52:33.391198',1,'Quartier El Wafa','18592020','1961-05-23','Maintenance','Op├⌐rateur','22430404'),(17,'1750454111','Hammami','Nour','emp017@test.com',1,'2026-02-24 23:52:33.397427',1,'Avenue Habib Bourguiba','65222478','2003-03-27','Qualit├⌐','Op├⌐rateur','28384245'),(18,'1793306904','Hammami','Yassine','emp018@test.com',1,'2026-02-24 23:52:33.403529',1,'R├⌐sidence El Amal','36271128','1978-11-02','Qualit├⌐','Superviseur','26267475'),(19,'1694416703','Khelifi','Rania','emp019@test.com',0,'2026-02-24 23:52:33.409217',1,'R├⌐sidence El Amal','50020896','1970-06-28','RH','Agent qualit├⌐','28734422'),(20,'1683114410','Trabelsi','Yassine','emp020@test.com',0,'2026-02-24 23:52:33.413736',1,'Quartier El Wafa','69538897','1969-08-22','RH','Superviseur','26056984'),(21,'1056538201','Ben Ali','Omar','emp021@test.com',0,'2026-02-24 23:52:33.418752',1,'Rue 01, Zone industrielle','96808844','1970-02-08','Maintenance','Agent qualit├⌐','22953764'),(22,'1750454112','Trabelsi','Omar','emp022@test.com',1,'2026-02-24 23:52:33.424266',1,'R├⌐sidence El Amal','82685800','1986-07-17','Production','Technicien','28246729'),(23,'1793306905','Hammami','Yassine','emp023@test.com',1,'2026-02-24 23:52:33.429277',1,'Avenue Habib Bourguiba','70729381','1964-08-23','RH','Agent qualit├⌐','26066279'),(24,'1694416704','Gharbi','Ahmed','emp024@test.com',1,'2026-02-24 23:52:33.434801',1,'R├⌐sidence El Amal','82094936','1963-09-06','Qualit├⌐','Superviseur','26023180'),(25,'1683114411','Ayadi','Mahdi','emp025@test.com',1,'2026-02-24 23:52:33.439806',1,'R├⌐sidence El Amal','86048494','1964-12-20','RH','Superviseur','27693643'),(26,'1056538202','Ayadi','Nour','emp026@test.com',1,'2026-02-24 23:52:33.445335',1,'Rue 01, Zone industrielle','19459424','1994-10-03','Maintenance','Op├⌐rateur','24246358'),(27,'1750454113','Trabelsi','Ahmed','emp027@test.com',1,'2026-02-24 23:52:33.451330',1,'R├⌐sidence El Amal','72661569','1970-09-04','Maintenance','Technicien','27172395'),(28,'1793306906','Ayadi','Sarra','emp028@test.com',1,'2026-02-24 23:52:33.457870',1,'Quartier El Wafa','23905560','1965-01-04','Production','Technicien','26162206'),(29,'1694416705','Jaziri','Mahdi','emp029@test.com',1,'2026-02-24 23:52:33.463870',1,'Quartier El Wafa','10208122','2001-05-22','Maintenance','Technicien','24001559'),(30,'1683114412','Masmoudi','Mariem','emp030@test.com',1,'2026-02-24 23:52:33.472388',1,'R├⌐sidence El Amal','91434928','1961-05-07','Production','Superviseur','25731270'),(31,'1056538203','Jaziri','Sarra','emp031@test.com',1,'2026-02-24 23:52:33.478253',1,'Quartier El Wafa','12183448','1994-05-15','Qualit├⌐','Agent qualit├⌐','26542997'),(32,'1750454114','Jaziri','Mahdi','emp032@test.com',1,'2026-02-24 23:52:33.484925',1,'Rue 01, Zone industrielle','30997687','1990-11-25','Maintenance','Technicien','28731207'),(33,'1793306907','Ben Ali','Nour','emp033@test.com',1,'2026-02-24 23:52:33.491948',1,'Quartier El Wafa','48123708','1994-08-14','Qualit├⌐','Op├⌐rateur','29496668'),(34,'1694416706','Ben Ali','Sarra','emp034@test.com',1,'2026-02-24 23:52:33.498462',1,'Avenue Habib Bourguiba','59993809','1983-06-05','RH','Op├⌐rateur','27896831'),(35,'1683114413','Ben Ali','Mahdi','emp035@test.com',1,'2026-02-24 23:52:33.503990',1,'R├⌐sidence El Amal','22385505','1976-09-15','RH','Superviseur','22718630'),(36,'1056538204','Ben Ali','Mariem','emp036@test.com',1,'2026-02-24 23:52:33.510185',1,'Quartier El Wafa','77418279','1979-08-12','RH','Technicien','22527776'),(37,'1750454115','Masmoudi','Sarra','emp037@test.com',1,'2026-02-24 23:52:33.516735',1,'Rue 01, Zone industrielle','95619605','1976-08-11','Maintenance','Agent qualit├⌐','27185121'),(38,'1793306908','Gharbi','Sarra','emp038@test.com',1,'2026-02-24 23:52:33.521278',1,'R├⌐sidence El Amal','49322983','1998-11-06','Qualit├⌐','Superviseur','22722630'),(39,'1694416707','Ben Ali','Yassine','emp039@test.com',1,'2026-02-24 23:52:33.527805',1,'Avenue Habib Bourguiba','61158934','1978-02-13','Production','Agent qualit├⌐','25316178'),(40,'1683114414','Masmoudi','Omar','emp040@test.com',0,'2026-02-24 23:52:33.533315',1,'R├⌐sidence El Amal','59944904','1963-02-12','Production','Superviseur','22803859'),(41,'1056538205','Jaziri','Rania','emp041@test.com',1,'2026-02-24 23:52:33.539944',1,'Rue 01, Zone industrielle','29988901','1966-11-28','Maintenance','Op├⌐rateur','25351374'),(42,'1750454116','Gharbi','Omar','emp042@test.com',1,'2026-02-24 23:52:33.548485',1,'Rue 01, Zone industrielle','34342581','1965-11-10','Maintenance','Agent qualit├⌐','28297308'),(43,'1793306909','Gharbi','Omar','emp043@test.com',0,'2026-02-24 23:52:33.554008',1,'Rue 01, Zone industrielle','24352837','1978-01-10','Qualit├⌐','Superviseur','27049207'),(44,'1694416708','Khelifi','Omar','emp044@test.com',1,'2026-02-24 23:52:33.560442',1,'Rue 01, Zone industrielle','96903122','1964-06-28','Qualit├⌐','Superviseur','23026753'),(45,'1683114415','Jaziri','Sarra','emp045@test.com',0,'2026-02-24 23:52:33.566982',1,'Avenue Habib Bourguiba','18502274','1966-04-18','RH','Op├⌐rateur','22317693'),(46,'1056538206','Ben Ali','Omar','emp046@test.com',1,'2026-02-24 23:52:33.574020',1,'Rue 01, Zone industrielle','97995654','1990-04-18','Production','Op├⌐rateur','27389998'),(47,'1750454117','Jaziri','Rania','emp047@test.com',1,'2026-02-24 23:52:33.579024',1,'Quartier El Wafa','92845886','1993-02-10','Production','Agent qualit├⌐','25978583'),(48,'1793306910','Khelifi','Yassine','emp048@test.com',1,'2026-02-24 23:52:33.585859',1,'Avenue Habib Bourguiba','94058414','2004-04-19','Qualit├⌐','Technicien','25557025'),(49,'1694416709','Hammami','Mahdi','emp049@test.com',0,'2026-02-24 23:52:33.591377',1,'Avenue Habib Bourguiba','59743773','1960-11-13','RH','Op├⌐rateur','27889526'),(50,'1683114416','Gharbi','Mariem','emp050@test.com',1,'2026-02-24 23:52:33.598008',1,'Quartier El Wafa','57750052','1998-05-16','Production','Superviseur','22764631');
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
  `nom_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_user`
--

LOCK TABLES `accounts_user` WRITE;
/*!40000 ALTER TABLE `accounts_user` DISABLE KEYS */;
INSERT INTO `accounts_user` VALUES (1,'pbkdf2_sha256$1000000$ynkKbuWxySzs8iQju0nPTn$DKJdSfkwybNf+xsSZk5QWLHEMuo1CBDuZVwSQZP0HU8=','2026-03-26 14:25:59.720517',1,'admin','','','roua.zanina@gmail.com',1,1,'2026-02-21 01:38:55.871610','ADMIN',NULL),(2,'pbkdf2_sha256$1000000$gtOOwbwcDV6Or7CWuP9MWh$UuAR1tRtc4VMVlMTmtV89AU/kgh0eausknPuAq5m9Zk=',NULL,0,'traitant','','','',0,1,'2026-02-23 01:44:12.000000','MEDECIN_TRAITANT',NULL),(3,'pbkdf2_sha256$1000000$q3ORzgJRGL8IJk6VT5PuQF$9iCbcIILIYM0dAARG2n6TMYfYJGCfOosqH6vB4ffYiQ=',NULL,0,'medecin-travail','','','',0,1,'2026-02-23 14:41:31.348600','MEDECIN_TRAVAIL',NULL),(4,'pbkdf2_sha256$1000000$aHB6XqRN9TuvMJUiRXsjbA$tB4X6V9dVqWH42ui2DSHgi9mrH504iCv1P8vpb5jk3M=',NULL,0,'medecin-controleur','','','',0,1,'2026-02-23 14:42:37.387217','MEDECIN_CONTROLEUR',NULL),(5,'pbkdf2_sha256$1000000$RWzpsMiERwwlMhMZGZLRW5$WRkSJO7SaXxYNIK2K07bKkJIyGmQSVzc0TvXChOvjiU=',NULL,0,'infirmier','','','',0,1,'2026-02-23 14:43:29.000000','INFIRMIER',NULL),(6,'pbkdf2_sha256$1000000$GwRAMS3STH6W8s5ym8oTnV$Sc/Ii7mun6Msl/PSrt8VwVXCsiyylB7XmmdwdzUy5yc=',NULL,0,'RESPONSABLE_RH','','','',0,1,'2026-02-23 14:44:00.934872','RESPONSABLE_RH',NULL),(7,'pbkdf2_sha256$1000000$AQ7ryj2bEiQeF75gi3soKM$DypeCOrpwXqrDeRy1pUuOWA0mQkg4PtyGwAYnuHBGBU=',NULL,0,'AGENT_HSEE','','','',0,1,'2026-02-23 14:44:43.914760','AGENT_HSEE',NULL),(8,'pbkdf2_sha256$1000000$ZWTXDndW4vgwjiavhFmIrT$m2lRSKZbUMj4Lz3D4oLaNr1ORxfElxpFlfrKj0udCD0=',NULL,0,'hamila.zeineb','Hamila','Zeineb','hamila.zeineb@leoni-med.tn',0,1,'2026-03-12 13:50:17.000000','MEDECIN_TRAITANT','╪▓┘è┘å╪¿ ┘ç┘à┘è┘ä╪⌐'),(9,'pbkdf2_sha256$1000000$Dbp0Y4UR6tZJ1OTbFjKXyJ$Lwkhmmwp4QyOkKD7hDoYokgoz6JhLcbN2LrwkQ8S4vE=',NULL,0,'rached.sleh','Rached','Sleh Eddine','rached.sleh@leoni-med.tn',0,1,'2026-03-12 13:55:19.000000','MEDECIN_TRAITANT','╪╡┘ä╪º╪¡ ╪º┘ä╪»┘è┘å ╪▒╪º╪┤╪»'),(10,'pbkdf2_sha256$1000000$EsMWOdkNwEDzgDJLtd6wZQ$MyQTAFQKpYO9tI0dNxa6affO3oeffDAQ1PsuxCrVkj0=',NULL,0,'soussi.chedhlia','soussi','Chedhlia','soussi.chedhlia@leoni-med.tn',0,1,'2026-03-12 13:57:24.000000','MEDECIN_TRAITANT','╪┤╪º╪░┘ä┘è╪⌐ ╪º┘ä╪│┘ê╪│┘è'),(11,'pbkdf2_sha256$1000000$nbpq0RLdwr6wI21xwpN8Z9$k+/FGvljnX00tgx9swWhc+fhJw1MH/6yftOwxMM2Y8M=',NULL,0,'Jammeli.Donia','Jammeli','Donia','',0,1,'2026-03-16 23:35:56.000000','MEDECIN_CONTROLEUR',NULL),(12,'pbkdf2_sha256$1000000$iRxRKjFbREJql8znxt3Pqj$yOdIOaWBh1+NtMRkpJuTFze/aOWhsAuXPmoVL+bsNo8=',NULL,0,'Abdallah.Badii','Abdallah','Badii','',0,1,'2026-03-16 23:38:00.000000','MEDECIN_TRAVAIL',NULL),(13,'pbkdf2_sha256$1000000$wVMTorzGahePIBsKrgPZEp$fbn+EkazFRwzapjWNyrDjEVhk/IVck9IMZoCaLUyrS8=',NULL,0,'Teyeb.Mariem','Teyeb','Mariem','',0,1,'2026-03-16 23:39:04.000000','MEDECIN_TRAVAIL',NULL),(14,'pbkdf2_sha256$1000000$0Bp0fnFK4JBqLZbjpNtG1i$LasoSKXT5Fy2P4IzJjflc0UAwXXbCwrYNkw81fqvb9I=',NULL,0,'Lassoued.Samia','Lassoued','Samia','',0,1,'2026-03-16 23:39:54.000000','MEDECIN_TRAVAIL',NULL);
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
  `medecin_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `appointments_appoint_collaborateur_id_2e7a88f6_fk_accounts_` (`collaborateur_id`),
  KEY `appointments_appointment_medecin_id_01d17ed6_fk_accounts_user_id` (`medecin_id`),
  CONSTRAINT `appointments_appoint_collaborateur_id_2e7a88f6_fk_accounts_` FOREIGN KEY (`collaborateur_id`) REFERENCES `accounts_collaborateur` (`id`),
  CONSTRAINT `appointments_appointment_medecin_id_01d17ed6_fk_accounts_user_id` FOREIGN KEY (`medecin_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments_appointment`
--

LOCK TABLES `appointments_appointment` WRITE;
/*!40000 ALTER TABLE `appointments_appointment` DISABLE KEYS */;
INSERT INTO `appointments_appointment` VALUES (1,'TRAVAIL','2026-02-02','08:00:00.000000','visite d\'embauche','PREVU','2026-03-06 05:55:42.026586',26,NULL),(2,'TRAITANT','2026-03-16','09:00:00.000000','','PREVU','2026-03-16 23:17:33.004019',33,NULL),(3,'TRAITANT','2026-03-17','09:00:00.000000','','PREVU','2026-03-16 23:29:59.665251',46,9);
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
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add user',6,'add_user'),(22,'Can change user',6,'change_user'),(23,'Can delete user',6,'delete_user'),(24,'Can view user',6,'view_user'),(25,'Can add collaborateur',7,'add_collaborateur'),(26,'Can change collaborateur',7,'change_collaborateur'),(27,'Can delete collaborateur',7,'delete_collaborateur'),(28,'Can view collaborateur',7,'view_collaborateur'),(29,'Can add ordonnance',8,'add_ordonnance'),(30,'Can change ordonnance',8,'change_ordonnance'),(31,'Can delete ordonnance',8,'delete_ordonnance'),(32,'Can view ordonnance',8,'view_ordonnance'),(33,'Can add fiche medicale',9,'add_fichemedicale'),(34,'Can change fiche medicale',9,'change_fichemedicale'),(35,'Can delete fiche medicale',9,'delete_fichemedicale'),(36,'Can view fiche medicale',9,'view_fichemedicale'),(37,'Can add certificat medical',10,'add_certificatmedical'),(38,'Can change certificat medical',10,'change_certificatmedical'),(39,'Can delete certificat medical',10,'delete_certificatmedical'),(40,'Can view certificat medical',10,'view_certificatmedical'),(41,'Can add dossier medical',11,'add_dossiermedical'),(42,'Can change dossier medical',11,'change_dossiermedical'),(43,'Can delete dossier medical',11,'delete_dossiermedical'),(44,'Can view dossier medical',11,'view_dossiermedical'),(45,'Can add accident travail',12,'add_accidenttravail'),(46,'Can change accident travail',12,'change_accidenttravail'),(47,'Can delete accident travail',12,'delete_accidenttravail'),(48,'Can view accident travail',12,'view_accidenttravail'),(49,'Can add examen initial',13,'add_exameninitial'),(50,'Can change examen initial',13,'change_exameninitial'),(51,'Can delete examen initial',13,'delete_exameninitial'),(52,'Can view examen initial',13,'view_exameninitial'),(53,'Can add examen ulterieur',14,'add_examenulterieur'),(54,'Can change examen ulterieur',14,'change_examenulterieur'),(55,'Can delete examen ulterieur',14,'delete_examenulterieur'),(56,'Can view examen ulterieur',14,'view_examenulterieur'),(57,'Can add maladie professionnelle',15,'add_maladieprofessionnelle'),(58,'Can change maladie professionnelle',15,'change_maladieprofessionnelle'),(59,'Can delete maladie professionnelle',15,'delete_maladieprofessionnelle'),(60,'Can view maladie professionnelle',15,'view_maladieprofessionnelle'),(61,'Can add poste travail',16,'add_postetravail'),(62,'Can change poste travail',16,'change_postetravail'),(63,'Can delete poste travail',16,'delete_postetravail'),(64,'Can view poste travail',16,'view_postetravail'),(65,'Can add vaccination',17,'add_vaccination'),(66,'Can change vaccination',17,'change_vaccination'),(67,'Can delete vaccination',17,'delete_vaccination'),(68,'Can view vaccination',17,'view_vaccination'),(69,'Can add site',18,'add_site'),(70,'Can change site',18,'change_site'),(71,'Can delete site',18,'delete_site'),(72,'Can view site',18,'view_site'),(73,'Can add rendez vous',19,'add_rendezvous'),(74,'Can change rendez vous',19,'change_rendezvous'),(75,'Can delete rendez vous',19,'delete_rendezvous'),(76,'Can view rendez vous',19,'view_rendezvous'),(77,'Can add appointment',20,'add_appointment'),(78,'Can change appointment',20,'change_appointment'),(79,'Can delete appointment',20,'delete_appointment'),(80,'Can view appointment',20,'view_appointment'),(81,'Can add stock item',21,'add_stockitem'),(82,'Can change stock item',21,'change_stockitem'),(83,'Can delete stock item',21,'delete_stockitem'),(84,'Can view stock item',21,'view_stockitem'),(85,'Can add stock movement',22,'add_stockmovement'),(86,'Can change stock movement',22,'change_stockmovement'),(87,'Can delete stock movement',22,'delete_stockmovement'),(88,'Can view stock movement',22,'view_stockmovement'),(89,'Can add incident infirmier',23,'add_incidentinfirmier'),(90,'Can change incident infirmier',23,'change_incidentinfirmier'),(91,'Can delete incident infirmier',23,'delete_incidentinfirmier'),(92,'Can view incident infirmier',23,'view_incidentinfirmier'),(93,'Can add plan action hsee',24,'add_planactionhsee'),(94,'Can change plan action hsee',24,'change_planactionhsee'),(95,'Can delete plan action hsee',24,'delete_planactionhsee'),(96,'Can view plan action hsee',24,'view_planactionhsee'),(97,'Can add demande examen labo',25,'add_demandeexamenlabo'),(98,'Can change demande examen labo',25,'change_demandeexamenlabo'),(99,'Can delete demande examen labo',25,'delete_demandeexamenlabo'),(100,'Can view demande examen labo',25,'view_demandeexamenlabo'),(101,'Can add examen complementaire',26,'add_examencomplementaire'),(102,'Can change examen complementaire',26,'change_examencomplementaire'),(103,'Can delete examen complementaire',26,'delete_examencomplementaire'),(104,'Can view examen complementaire',26,'view_examencomplementaire'),(105,'Can add fiche aptitude',27,'add_ficheaptitude'),(106,'Can change fiche aptitude',27,'change_ficheaptitude'),(107,'Can delete fiche aptitude',27,'delete_ficheaptitude'),(108,'Can view fiche aptitude',27,'view_ficheaptitude'),(109,'Can add notification',28,'add_notification'),(110,'Can change notification',28,'change_notification'),(111,'Can delete notification',28,'delete_notification'),(112,'Can view notification',28,'view_notification'),(113,'Can add cnam declaration',29,'add_cnamdeclaration'),(114,'Can change cnam declaration',29,'change_cnamdeclaration'),(115,'Can delete cnam declaration',29,'delete_cnamdeclaration'),(116,'Can view cnam declaration',29,'view_cnamdeclaration');
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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (1,'2026-02-23 01:44:13.716172','2','traitant - ',1,'[{\"added\": {}}]',6,1),(2,'2026-02-23 14:41:32.008571','3','medecin-travail - MEDECIN_TRAVAIL',1,'[{\"added\": {}}]',6,1),(3,'2026-02-23 14:42:38.103165','4','medecin-controleur - MEDECIN_CONTROLEUR',1,'[{\"added\": {}}]',6,1),(4,'2026-02-23 14:43:30.028442','5','infirmier - INFIRMIER',1,'[{\"added\": {}}]',6,1),(5,'2026-02-23 14:44:01.609561','6','RESPONSABLE_RH - RESPONSABLE_RH',1,'[{\"added\": {}}]',6,1),(6,'2026-02-23 14:44:44.584668','7','AGENT_HSEE - HSEE',1,'[{\"added\": {}}]',6,1),(7,'2026-03-01 16:35:45.645584','1','MEDECIN_TRAITANT',1,'[{\"added\": {}}]',3,1),(8,'2026-03-01 16:37:24.740338','2','traitant',2,'[{\"changed\": {\"fields\": [\"Groups\"]}}]',6,1),(9,'2026-03-04 07:28:31.224389','1','LEONI - Menzel Hayet',1,'[{\"added\": {}}]',18,1),(10,'2026-03-04 07:39:40.482673','50','EMP050 - Gharbi Mariem',2,'[{\"changed\": {\"fields\": [\"Site\"]}}]',7,1),(11,'2026-03-04 07:41:04.658971','50','EMP050 - Gharbi Mariem',2,'[]',7,1),(12,'2026-03-04 07:49:11.994636','50','EMP050 - Gharbi Mariem',2,'[]',7,1),(13,'2026-03-06 01:33:45.497969','5','infirmier (INFIRMIER)',2,'[]',6,1),(14,'2026-03-12 13:49:57.669770','2','traitant (MEDECIN_TRAITANT)',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',6,1),(15,'2026-03-12 13:54:55.009147','8','hamila.zeineb (MEDECIN_TRAITANT)',1,'[{\"added\": {}}]',6,1),(16,'2026-03-12 13:55:15.300808','2','traitant (MEDECIN_TRAITANT)',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',6,1),(17,'2026-03-12 13:56:47.744715','9','rached.sleh (MEDECIN_TRAITANT)',1,'[{\"added\": {}}]',6,1),(18,'2026-03-12 13:58:25.748391','10','soussi.chedhlia (MEDECIN_TRAITANT)',1,'[{\"added\": {}}]',6,1),(19,'2026-03-12 14:02:35.306553','8','hamila.zeineb (MEDECIN_TRAITANT)',2,'[]',6,1),(20,'2026-03-16 23:09:02.903175','10','soussi.chedhlia (MEDECIN_TRAITANT)',2,'[{\"changed\": {\"fields\": [\"Nom ar\"]}}]',6,1),(21,'2026-03-16 23:11:26.077307','9','rached.sleh (MEDECIN_TRAITANT)',2,'[{\"changed\": {\"fields\": [\"Nom ar\"]}}]',6,1),(22,'2026-03-16 23:13:09.680150','8','hamila.zeineb (MEDECIN_TRAITANT)',2,'[{\"changed\": {\"fields\": [\"Nom ar\"]}}]',6,1),(23,'2026-03-16 23:37:42.823694','11','Jammeli.Donia (MEDECIN_CONTROLEUR)',1,'[{\"added\": {}}]',6,1),(24,'2026-03-16 23:38:59.169852','12','Abdallah.Badii (MEDECIN_TRAVAIL)',1,'[{\"added\": {}}]',6,1),(25,'2026-03-16 23:39:49.855406','13','Teyeb.Mariem (MEDECIN_TRAVAIL)',1,'[{\"added\": {}}]',6,1),(26,'2026-03-16 23:40:34.593653','14','Lassoued.Samia (MEDECIN_TRAVAIL)',1,'[{\"added\": {}}]',6,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (7,'accounts','collaborateur'),(18,'accounts','site'),(6,'accounts','user'),(1,'admin','logentry'),(20,'appointments','appointment'),(19,'appointments','rendezvous'),(3,'auth','group'),(2,'auth','permission'),(4,'contenttypes','contenttype'),(12,'medical','accidenttravail'),(10,'medical','certificatmedical'),(29,'medical','cnamdeclaration'),(25,'medical','demandeexamenlabo'),(11,'medical','dossiermedical'),(26,'medical','examencomplementaire'),(13,'medical','exameninitial'),(14,'medical','examenulterieur'),(27,'medical','ficheaptitude'),(9,'medical','fichemedicale'),(23,'medical','incidentinfirmier'),(15,'medical','maladieprofessionnelle'),(8,'medical','ordonnance'),(24,'medical','planactionhsee'),(16,'medical','postetravail'),(21,'medical','stockitem'),(22,'medical','stockmovement'),(17,'medical','vaccination'),(28,'notifications','notification'),(5,'sessions','session');
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-02-21 01:35:51.308757'),(2,'contenttypes','0002_remove_content_type_name','2026-02-21 01:35:51.435144'),(3,'auth','0001_initial','2026-02-21 01:35:51.794004'),(4,'auth','0002_alter_permission_name_max_length','2026-02-21 01:35:51.923415'),(5,'auth','0003_alter_user_email_max_length','2026-02-21 01:35:51.930857'),(6,'auth','0004_alter_user_username_opts','2026-02-21 01:35:51.938981'),(7,'auth','0005_alter_user_last_login_null','2026-02-21 01:35:51.948444'),(8,'auth','0006_require_contenttypes_0002','2026-02-21 01:35:51.956667'),(9,'auth','0007_alter_validators_add_error_messages','2026-02-21 01:35:51.961938'),(10,'auth','0008_alter_user_username_max_length','2026-02-21 01:35:51.969009'),(11,'auth','0009_alter_user_last_name_max_length','2026-02-21 01:35:51.976610'),(12,'auth','0010_alter_group_name_max_length','2026-02-21 01:35:51.995096'),(13,'auth','0011_update_proxy_permissions','2026-02-21 01:35:52.003647'),(14,'auth','0012_alter_user_first_name_max_length','2026-02-21 01:35:52.010649'),(15,'accounts','0001_initial','2026-02-21 01:35:52.492780'),(16,'admin','0001_initial','2026-02-21 01:35:52.746314'),(17,'admin','0002_logentry_remove_auto_add','2026-02-21 01:35:52.753875'),(18,'admin','0003_logentry_add_action_flag_choices','2026-02-21 01:35:52.763036'),(19,'sessions','0001_initial','2026-02-21 01:35:52.816659'),(20,'accounts','0002_collaborateur_remove_user_actif_and_more','2026-02-23 15:47:03.355509'),(22,'medical','0001_initial','2026-03-01 03:35:23.846680'),(23,'accounts','0003_site_collaborateur_site','2026-03-04 07:17:56.671066'),(24,'accounts','0004_alter_collaborateur_site','2026-03-04 07:37:06.589128'),(25,'appointments','0001_initial','2026-03-06 05:26:41.992666'),(26,'appointments','0002_appointment_delete_rendezvous','2026-03-06 05:53:04.395410'),(27,'medical','0002_stockitem_stockmovement','2026-03-06 06:19:48.502277'),(28,'medical','0003_accidenttravail_circonstances_and_more','2026-03-06 19:56:35.211458'),(29,'medical','0004_accidenttravail_gravite_accidenttravail_segment_and_more','2026-03-06 23:42:11.109844'),(30,'medical','0005_dossiermedical_alcool_and_more','2026-03-08 06:46:51.566946'),(31,'accounts','0005_collaborateur_adresse_collaborateur_cin_and_more','2026-03-08 07:35:39.286465'),(32,'medical','0006_remove_examenulterieur_audition_and_more','2026-03-08 08:22:25.430134'),(33,'accounts','0006_user_nom_ar','2026-03-16 23:01:21.576106'),(34,'appointments','0003_appointment_medecin','2026-03-16 23:23:16.096673'),(35,'notifications','0001_initial','2026-03-16 23:25:03.508820'),(36,'medical','0007_incidentinfirmier_cause_incidentinfirmier_date_bon_and_more','2026-03-17 15:15:25.129386'),(37,'medical','0008_cnamdeclaration','2026-03-17 16:04:25.006597'),(38,'medical','0007_accidenttravail_activite_lieu_and_more','2026-03-27 12:04:43.548508');
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
INSERT INTO `django_session` VALUES ('6jhjjos9o9fow022i01jqml5eqibyqey','.eJxVjEEOwiAQRe_C2pCCMIBL9z0DGYZBqoYmpV0Z765NutDtf-_9l4i4rTVunZc4ZXERSpx-t4T04LaDfMd2myXNbV2mJHdFHrTLcc78vB7u30HFXr81g6HivTPswZ5tMahC4AEVOu1KAghgLQ-GLBULBlImTeQwaXJKaxbvD9qNN-M:1vtbym:se7ujYdd5mfWB2NVC9ylroPDrqmtbC9kkWVIvdv1ERs','2026-03-07 01:40:20.794394'),('d959ls5ni3rjp6mx9p4qvvifg475mhcw','.eJxVjEEOwiAQAP_C2RAoyIJH776B7C5UqgaS0p6MfzckPeh1ZjJvEXHfStx7XuOSxEVocfplhPzMdYj0wHpvklvd1oXkSORhu7y1lF_Xo_0bFOxlbA1r65ltoMAOFCnlMwHMyTgwOSggfwYExmmeADNphQzOYCKvrSPx-QLc1jf8:1w0ghD:-1nK2achG7JdUP-0byz6m-c_Qyw7XWQ6DZ81e5YZ9bg','2026-03-26 14:07:27.024082'),('h8f6db7gjjm1369lhw4b9ahsd6tsf61f','.eJxVjEEOwiAQAP_C2RAoyIJH776B7C5UqgaS0p6MfzckPeh1ZjJvEXHfStx7XuOSxEVocfplhPzMdYj0wHpvklvd1oXkSORhu7y1lF_Xo_0bFOxlbA1r65ltoMAOFCnlMwHMyTgwOSggfwYExmmeADNphQzOYCKvrSPx-QLc1jf8:1w0ggy:ROMItx1_TiDQ8NcWwrbVJkM1MlWbrBNk9ufHnc1hiw8','2026-03-26 14:07:12.710222'),('km8lkci2khhl128n6co06e55z2whpr9w','.eJxVjEEOwiAQAP_C2RAoyIJH776B7C5UqgaS0p6MfzckPeh1ZjJvEXHfStx7XuOSxEVocfplhPzMdYj0wHpvklvd1oXkSORhu7y1lF_Xo_0bFOxlbA1r65ltoMAOFCnlMwHMyTgwOSggfwYExmmeADNphQzOYCKvrSPx-QLc1jf8:1w5lep:sXH21Hl_K5XML_g5zzdWAC6efrNJChzrGcFtwz__mq0','2026-04-09 14:25:59.735979');
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
  `activite_lieu` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activite_lieu_autre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `autres_victimes` tinyint(1) NOT NULL,
  `causes_materielles` longtext COLLATE utf8mb4_unicode_ci,
  `comment_accident` longtext COLLATE utf8mb4_unicode_ci,
  `date_arret` date DEFAULT NULL,
  `description_circonstances` longtext COLLATE utf8mb4_unicode_ci,
  `employeur_activite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_cnss` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_code_postal` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_nom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `heure_arret` time(6) DEFAULT NULL,
  `horaire_travail_debut` time(6) DEFAULT NULL,
  `horaire_travail_fin` time(6) DEFAULT NULL,
  `nombre_travailleurs` int unsigned DEFAULT NULL,
  `rapport_police` tinyint(1) NOT NULL,
  `rapport_police_date` date DEFAULT NULL,
  `rapport_police_numero` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rapport_police_poste` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resultat` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaire_duree` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaire_maintenu` tinyint(1) NOT NULL,
  `salaire_montant` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaire_unite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signataire_nom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signataire_qualite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_date` date DEFAULT NULL,
  `signature_lieu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temoins` longtext COLLATE utf8mb4_unicode_ci,
  `tiers_assureur` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiers_nom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiers_responsable` tinyint(1) NOT NULL,
  `victime_adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_cin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_cnss` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_code_postal` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_date_embauche` date DEFAULT NULL,
  `victime_date_naissance` date DEFAULT NULL,
  `victime_lieu_naissance` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_lieu_travail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_nationalite` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_nom` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_nom_naissance` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_poste_accident` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_prenom` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_prenom_pere` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_profession` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_sexe` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_situation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_specialite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_accidenttrav_dossier_id_b19140c5_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_accidenttrav_dossier_id_b19140c5_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`),
  CONSTRAINT `medical_accidenttravail_chk_1` CHECK ((`nombre_travailleurs` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_accidenttravail`
--

LOCK TABLES `medical_accidenttravail` WRITE;
/*!40000 ALTER TABLE `medical_accidenttravail` DISABLE KEYS */;
INSERT INTO `medical_accidenttravail` VALUES (1,'2026-03-01','Sol glissant','Entorse','Cheville droite',3,'0%',7,'Le collaborateur a gliss├⌐ sur une zone humide pr├¿s du poste de travail','2026-03-07 01:08:24.421311',1,'09:00:00.000000','Atelier c├óblage','EMP045','Ahmed Ben Ali','22123456','','','','Non',NULL,NULL,'TERMINEE',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'2026-03-02','Manipulation outil tranchant','Coupure profonde','Main gauche',12,'5%',5,'Le collaborateur s\'est bless├⌐ lors d\'une op├⌐ration de maintenance sur un ├⌐quipement','2026-03-07 01:15:56.961388',1,'10:15:00.000000','Maintenance','','Walid Gharbi','21555666','','','','Ambulance',NULL,NULL,'TERMINEE',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'2026-01-06','Mauvaise manutention','Lombalgie','Dos',7,'0%',28,'Le collaborateur a soulev├⌐ une charge lourde avec une mauvaise posture.','2026-03-07 01:23:21.570690',1,'10:00:00.000000','Zone logistique','','Nadia Cherif','20111222','','','','Non',NULL,NULL,'TERMINEE',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_certificatmedical`
--

LOCK TABLES `medical_certificatmedical` WRITE;
/*!40000 ALTER TABLE `medical_certificatmedical` DISABLE KEYS */;
INSERT INTO `medical_certificatmedical` VALUES (1,'2026-03-05',5,'2026-02-15','','2026-03-05 01:34:25.220209',25,2),(2,'2026-03-05',4,'2015-12-20','','2026-03-05 03:24:08.857534',25,2),(3,'2026-03-06',5,'2026-03-02','','2026-03-06 21:14:49.069522',25,2),(4,'2026-03-12',1,'2026-03-03','','2026-03-12 12:48:03.171576',25,2),(5,'2026-03-12',1,'2028-03-04','','2026-03-12 13:40:41.829381',25,2),(6,'2026-03-12',2,'2026-03-09','','2026-03-12 14:21:49.704491',25,8),(7,'2026-03-12',4,'2026-03-10','','2026-03-12 14:50:15.779744',16,8),(8,'2026-03-12',4,'2026-03-12','','2026-03-12 15:03:38.888814',35,8),(9,'2026-03-12',3,'2026-04-12','','2026-03-12 15:10:43.155939',36,8),(10,'2026-03-12',23,'2026-03-01','','2026-03-12 15:21:01.142677',25,8),(11,'2026-03-13',1,'2026-03-12','','2026-03-13 12:47:44.051301',25,9),(12,'2026-03-15',1,'2026-03-05','','2026-03-15 14:42:23.228528',25,8),(13,'2026-03-16',1,'2026-02-12','','2026-03-16 22:26:08.884808',25,10);
/*!40000 ALTER TABLE `medical_certificatmedical` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_cnamdeclaration`
--

DROP TABLE IF EXISTS `medical_cnamdeclaration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_cnamdeclaration` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_cnamdeclarat_dossier_id_aa0fa70f_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_cnamdeclarat_dossier_id_aa0fa70f_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_cnamdeclaration`
--

LOCK TABLES `medical_cnamdeclaration` WRITE;
/*!40000 ALTER TABLE `medical_cnamdeclaration` DISABLE KEYS */;
INSERT INTO `medical_cnamdeclaration` VALUES (1,'AT_TRAVAIL','{\"collab_cin\": \"86048494\", \"collab_nom\": \"Ayadi\", \"collab_cnss\": \"\", \"collab_sexe\": \"\", \"collab_poste\": \"Superviseur\", \"accident_date\": \"\", \"accident_lieu\": \"\", \"collab_prenom\": \"Mahdi\", \"employeur_nom\": \"\", \"maladie_poste\": \"\", \"accident_arret\": \"\", \"accident_cause\": \"\", \"accident_heure\": \"\", \"accident_soins\": \"\", \"collab_adresse\": \"R├⌐sidence El Amal\", \"employeur_cnss\": \"\", \"maladie_nature\": \"\", \"accident_temoin1\": \"\", \"accident_temoin2\": \"\", \"collab_matricule\": \"1683114411\", \"collab_telephone\": \"27693643\", \"collab_etat_civil\": \"\", \"employeur_adresse\": \"\", \"maladie_symptomes\": \"\", \"accident_transport\": \"\", \"employeur_activite\": \"\", \"maladie_diagnostic\": \"\", \"employeur_telephone\": \"\", \"maladie_agent_causal\": \"\", \"maladie_date_constat\": \"\", \"accident_siege_lesion\": \"\", \"collab_date_naissance\": \"1964-12-20\", \"accident_circonstances\": \"\", \"accident_nature_lesion\": \"\", \"maladie_exposition_fin\": \"\", \"maladie_exposition_debut\": \"\", \"accident_date_declaration\": \"\"}','2026-03-17 19:41:02.168059','2026-03-17 19:58:04.577292',1),(2,'AT_TRAVAIL','{\"collab_cin\": \"18592020\", \"collab_nom\": \"Ayadi\", \"collab_cnss\": \"\", \"collab_sexe\": \"\", \"collab_poste\": \"Op├⌐rateur\", \"accident_date\": \"\", \"accident_lieu\": \"\", \"collab_prenom\": \"Yassine\", \"employeur_nom\": \"\", \"maladie_poste\": \"\", \"accident_arret\": \"\", \"accident_cause\": \"\", \"accident_heure\": \"\", \"accident_soins\": \"\", \"collab_adresse\": \"Quartier El Wafa\", \"employeur_cnss\": \"\", \"maladie_nature\": \"\", \"accident_temoin1\": \"\", \"accident_temoin2\": \"\", \"collab_matricule\": \"1056538200\", \"collab_telephone\": \"22430404\", \"collab_etat_civil\": \"\", \"employeur_adresse\": \"\", \"maladie_symptomes\": \"\", \"accident_transport\": \"\", \"employeur_activite\": \"\", \"maladie_diagnostic\": \"\", \"employeur_telephone\": \"\", \"maladie_agent_causal\": \"\", \"maladie_date_constat\": \"\", \"accident_siege_lesion\": \"\", \"collab_date_naissance\": \"1961-05-23\", \"accident_circonstances\": \"\", \"accident_nature_lesion\": \"\", \"maladie_exposition_fin\": \"\", \"maladie_exposition_debut\": \"\", \"accident_date_declaration\": \"\"}','2026-03-17 19:48:06.422588','2026-03-17 19:48:21.035604',9);
/*!40000 ALTER TABLE `medical_cnamdeclaration` ENABLE KEYS */;
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
INSERT INTO `medical_dossiermedical` VALUES (1,'LEONI','Menzel Hayet','2026-03-04 06:58:21.348313',25,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2016-02-20','Bac','Superviseur','Superviseur','Non'),(2,'LEONI','Menzel Hayet','2026-03-04 07:02:18.876878',7,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2026-03-19','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(3,'LEONI','Menzel Hayet','2026-03-04 07:21:10.112980',26,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2024-11-22','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(4,'LEONI','Menzel Hayet','2026-03-04 07:38:40.149751',6,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2018-08-06','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(5,'LEONI','Menzel Hayet','2026-03-04 07:40:58.050283',50,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2019-03-27','Bac','Superviseur','Superviseur','Non'),(6,'LEONI','Menzel Hayet','2026-03-04 07:57:33.394054',28,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2016-09-07','Bac','Technicien','Technicien','Non'),(7,'LEONI','Menzel Hayet','2026-03-04 07:57:52.380887',35,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2023-11-25','Bac','Superviseur','Superviseur','Non'),(8,'LEONI','Menzel Hayet','2026-03-06 19:03:37.217205',5,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2019-11-18','Bac','Superviseur','Superviseur','Non'),(9,'LEONI','Menzel Hayet','2026-03-06 19:03:37.295350',16,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2021-04-29','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(10,'LEONI','Menzel Hayet','2026-03-06 19:03:37.434870',46,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2026-04-05','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(11,'LEONI','Menzel Hayet','2026-03-06 19:03:37.469126',36,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2018-12-25','Bac','Technicien','Technicien','Non'),(12,'LEONI','Menzel Hayet','2026-03-06 19:03:37.475583',33,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2019-09-16','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(13,'LEONI','Menzel Hayet','2026-03-06 19:03:37.497863',34,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2020-01-13','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(14,'LEONI','Menzel Hayet','2026-03-06 19:03:37.561959',39,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2022-08-30','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(15,'LEONI','Menzel Hayet','2026-03-06 19:03:37.642761',24,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2025-05-29','Bac','Superviseur','Superviseur','Non'),(16,'LEONI','Menzel Hayet','2026-03-06 19:03:37.677621',21,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2023-11-17','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(17,'LEONI','Menzel Hayet','2026-03-06 19:03:37.750986',43,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2018-07-27','Bac','Superviseur','Superviseur','Non'),(18,'LEONI','Menzel Hayet','2026-03-06 19:03:37.795408',11,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2018-03-25','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(19,'LEONI','Menzel Hayet','2026-03-06 19:03:37.835007',42,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2016-03-30','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(20,'LEONI','Menzel Hayet','2026-03-06 19:03:37.874751',12,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2018-12-06','Bac','Superviseur','Superviseur','Non'),(21,'LEONI','Menzel Hayet','2026-03-06 19:03:37.943291',49,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2025-01-30','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(22,'LEONI','Menzel Hayet','2026-03-06 19:03:37.945831',4,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2025-03-21','Bac','Superviseur','Superviseur','Non'),(23,'LEONI','Menzel Hayet','2026-03-06 19:03:38.013350',38,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2017-12-31','Bac','Superviseur','Superviseur','Non'),(24,'LEONI','Menzel Hayet','2026-03-06 19:03:38.081284',23,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2016-10-02','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(25,'LEONI','Menzel Hayet','2026-03-06 19:03:38.100630',17,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2025-04-22','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(26,'LEONI','Menzel Hayet','2026-03-06 19:03:38.130656',18,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2020-10-18','Bac','Superviseur','Superviseur','Non'),(27,'LEONI','Menzel Hayet','2026-03-06 19:03:38.168704',29,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2020-07-16','Bac','Technicien','Technicien','Non'),(28,'LEONI','Menzel Hayet','2026-03-06 19:03:38.175126',32,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2015-03-07','Bac','Technicien','Technicien','Non'),(29,'LEONI','Menzel Hayet','2026-03-06 19:03:38.189984',9,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2016-01-27','Bac','Technicien','Technicien','Non'),(30,'LEONI','Menzel Hayet','2026-03-06 19:03:38.303876',10,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2021-01-24','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(31,'LEONI','Menzel Hayet','2026-03-06 19:03:38.309511',41,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2015-10-27','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(32,'LEONI','Menzel Hayet','2026-03-06 19:03:38.318324',14,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2019-10-04','Bac','Superviseur','Superviseur','Non'),(33,'LEONI','Menzel Hayet','2026-03-06 19:03:38.342272',47,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2021-05-18','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(34,'LEONI','Menzel Hayet','2026-03-06 19:03:38.350117',15,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2018-07-26','Bac','Superviseur','Superviseur','Non'),(35,'LEONI','Menzel Hayet','2026-03-06 19:03:38.377520',31,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2021-07-14','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(36,'LEONI','Menzel Hayet','2026-03-06 19:03:38.467475',45,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2017-04-06','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(37,'LEONI','Menzel Hayet','2026-03-06 19:03:38.485757',19,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2017-10-22','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(38,'LEONI','Menzel Hayet','2026-03-06 19:03:38.497859',13,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2023-07-06','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(39,'LEONI','Menzel Hayet','2026-03-06 19:03:38.498861',44,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2017-05-03','Bac','Superviseur','Superviseur','Non'),(40,'LEONI','Menzel Hayet','2026-03-06 19:03:38.559559',30,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2016-06-19','Bac','Superviseur','Superviseur','Non'),(41,'LEONI','Menzel Hayet','2026-03-06 19:03:38.571557',3,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2022-08-14','Bac','Technicien','Technicien','Non'),(42,'LEONI','Menzel Hayet','2026-03-06 19:03:38.615696',48,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2016-04-30','Bac','Technicien','Technicien','Non'),(43,'LEONI','Menzel Hayet','2026-03-06 19:03:38.622184',40,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2026-10-05','Bac','Superviseur','Superviseur','Non'),(44,'LEONI','Menzel Hayet','2026-03-06 19:03:38.645348',1,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2025-05-24','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(45,'LEONI','Menzel Hayet','2026-03-06 19:03:38.678653',37,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2018-12-21','Bac','Agent qualit├⌐','Agent qualit├⌐','Non'),(46,'LEONI','Menzel Hayet','2026-03-06 19:03:38.758068',8,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2020-11-21','Bac','Op├⌐rateur','Op├⌐rateur','Non'),(47,'LEONI','Menzel Hayet','2026-03-06 19:03:38.760076',27,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2026-03-13','Bac','Technicien','Technicien','Non'),(48,'LEONI','Menzel Hayet','2026-03-06 19:03:38.765655',22,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2023-12-26','Bac','Technicien','Technicien','Non'),(49,'LEONI','Menzel Hayet','2026-03-06 19:03:38.838281',2,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2025-01-20','Bac','Superviseur','Superviseur','Non'),(50,'LEONI','Menzel Hayet','2026-03-06 19:03:38.867011',20,'Non','N├⌐ant','N├⌐ant','N├⌐ant','N├⌐ant','Non','2022-04-28','Bac','Superviseur','Superviseur','Non');
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_exameninitial`
--

LOCK TABLES `medical_exameninitial` WRITE;
/*!40000 ALTER TABLE `medical_exameninitial` DISABLE KEYS */;
INSERT INTO `medical_exameninitial` VALUES (1,'Docteur','2024-01-01',56,172,'12/8','70','Apte au poste',44,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(2,'Docteur','2024-01-01',92,182,'12/8','70','Apte au poste',49,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(3,'Docteur','2024-01-01',90,167,'12/8','70','Apte au poste',41,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(4,'Docteur','2024-01-01',55,165,'12/8','70','Apte au poste',22,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(5,'Docteur','2024-01-01',76,161,'12/8','70','Apte au poste',8,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(6,'Docteur','2024-01-01',57,184,'12/8','70','Apte au poste',4,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(7,'Docteur','2024-01-01',95,178,'12/8','70','Apte au poste',2,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(8,'Docteur','2024-01-01',60,169,'12/8','70','Apte au poste',46,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(9,'Docteur','2024-01-01',78,177,'12/8','70','Apte au poste',29,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(10,'Docteur','2024-01-01',65,184,'12/8','70','Apte au poste',30,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(11,'Docteur','2024-01-01',69,157,'12/8','70','Apte au poste',18,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(12,'Docteur','2024-01-01',68,186,'12/8','70','Apte au poste',20,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(13,'Docteur','2024-01-01',90,189,'12/8','70','Apte au poste',38,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(14,'Docteur','2024-01-01',69,163,'12/8','70','Apte au poste',32,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(15,'Docteur','2024-01-01',95,165,'12/8','70','Apte au poste',34,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(16,'Docteur','2024-01-01',88,171,'12/8','70','Apte au poste',9,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(17,'Docteur','2024-01-01',62,173,'12/8','70','Apte au poste',25,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(18,'Docteur','2024-01-01',87,161,'12/8','70','Apte au poste',26,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(19,'Docteur','2024-01-01',78,165,'12/8','70','Apte au poste',37,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(20,'Docteur','2024-01-01',56,162,'12/8','70','Apte au poste',50,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(21,'Docteur','2024-01-01',60,186,'12/8','70','Apte au poste',16,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(22,'Docteur','2024-01-01',71,188,'12/8','70','Apte au poste',48,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(23,'Docteur','2024-01-01',80,178,'12/8','70','Apte au poste',24,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(24,'Docteur','2024-01-01',59,176,'12/8','70','Apte au poste',15,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(25,'Docteur','2024-01-01',55,159,'12/8','70','Apte au poste',1,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(26,'Docteur','2024-01-01',57,176,'12/8','70','Apte au poste',3,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(27,'Docteur','2024-01-01',89,163,'12/8','70','Apte au poste',47,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(28,'Docteur','2024-01-01',67,161,'12/8','70','Apte au poste',6,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(29,'Docteur','2024-01-01',58,161,'12/8','70','Apte au poste',27,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(30,'Docteur','2024-01-01',67,189,'12/8','70','Apte au poste',40,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(31,'Docteur','2024-01-01',70,159,'12/8','70','Apte au poste',35,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(32,'Docteur','2024-01-01',60,170,'12/8','70','Apte au poste',28,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(33,'Docteur','2024-01-01',58,165,'12/8','70','Apte au poste',12,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(34,'Docteur','2024-01-01',82,190,'12/8','70','Apte au poste',13,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(35,'Docteur','2024-01-01',58,189,'12/8','70','Apte au poste',7,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(36,'Docteur','2024-01-01',87,188,'12/8','70','Apte au poste',11,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(37,'Docteur','2024-01-01',93,159,'12/8','70','Apte au poste',45,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(38,'Docteur','2024-01-01',92,157,'12/8','70','Apte au poste',23,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(39,'Docteur','2024-01-01',71,168,'12/8','70','Apte au poste',14,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(40,'Docteur','2024-01-01',74,184,'12/8','70','Apte au poste',43,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(41,'Docteur','2024-01-01',59,189,'12/8','70','Apte au poste',31,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(42,'Docteur','2024-01-01',70,178,'12/8','70','Apte au poste',19,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(43,'Docteur','2024-01-01',90,174,'12/8','70','Apte au poste',17,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(44,'Docteur','2024-01-01',90,164,'12/8','70','Apte au poste',39,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(45,'Docteur','2024-01-01',87,186,'12/8','70','Apte au poste',36,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(46,'Docteur','2024-01-01',55,176,'12/8','70','Apte au poste',10,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(47,'Docteur','2024-01-01',90,155,'12/8','70','Apte au poste',33,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(48,'Docteur','2024-01-01',92,190,'12/8','70','Apte au poste',42,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(49,'Docteur','2024-01-01',57,177,'12/8','70','Apte au poste',21,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10'),(50,'Docteur','2024-01-01',94,164,'12/8','70','Apte au poste',5,'Souple','RAS','RAS','RAS','RAS','APTE','Normale','Normale','Normale','Aucun','RAS','Apte','Normal','RAS','Normaux','10/10','10/10','10/10','10/10');
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_examenulterieur`
--

LOCK TABLES `medical_examenulterieur` WRITE;
/*!40000 ALTER TABLE `medical_examenulterieur` DISABLE KEYS */;
INSERT INTO `medical_examenulterieur` VALUES (1,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',69,163,'RAS',44),(2,'PERIODIQUE','2024-06-01','Docteur','Superviseur',56,160,'RAS',49),(3,'PERIODIQUE','2024-06-01','Docteur','Technicien',89,181,'RAS',41),(4,'PERIODIQUE','2024-06-01','Docteur','Superviseur',82,176,'RAS',22),(5,'PERIODIQUE','2024-06-01','Docteur','Superviseur',79,161,'RAS',8),(6,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',62,179,'RAS',4),(7,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',67,159,'RAS',2),(8,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',79,172,'RAS',46),(9,'PERIODIQUE','2024-06-01','Docteur','Technicien',72,159,'RAS',29),(10,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',72,190,'RAS',30),(11,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',80,172,'RAS',18),(12,'PERIODIQUE','2024-06-01','Docteur','Superviseur',84,164,'RAS',20),(13,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',92,182,'RAS',38),(14,'PERIODIQUE','2024-06-01','Docteur','Superviseur',86,160,'RAS',32),(15,'PERIODIQUE','2024-06-01','Docteur','Superviseur',82,159,'RAS',34),(16,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',55,162,'RAS',9),(17,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',65,184,'RAS',25),(18,'PERIODIQUE','2024-06-01','Docteur','Superviseur',74,187,'RAS',26),(19,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',88,155,'RAS',37),(20,'PERIODIQUE','2024-06-01','Docteur','Superviseur',74,170,'RAS',50),(21,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',89,163,'RAS',16),(22,'PERIODIQUE','2024-06-01','Docteur','Technicien',82,168,'RAS',48),(23,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',88,183,'RAS',24),(24,'PERIODIQUE','2024-06-01','Docteur','Superviseur',92,190,'RAS',15),(25,'PERIODIQUE','2024-06-01','Docteur','Superviseur',95,158,'RAS',1),(26,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',87,170,'RAS',3),(27,'PERIODIQUE','2024-06-01','Docteur','Technicien',91,185,'RAS',47),(28,'PERIODIQUE','2024-06-01','Docteur','Technicien',82,177,'RAS',6),(29,'PERIODIQUE','2024-06-01','Docteur','Technicien',80,176,'RAS',27),(30,'PERIODIQUE','2024-06-01','Docteur','Superviseur',63,182,'RAS',40),(31,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',90,161,'RAS',35),(32,'PERIODIQUE','2024-06-01','Docteur','Technicien',81,186,'RAS',28),(33,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',55,179,'RAS',12),(34,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',86,164,'RAS',13),(35,'PERIODIQUE','2024-06-01','Docteur','Superviseur',75,158,'RAS',7),(36,'PERIODIQUE','2024-06-01','Docteur','Technicien',58,187,'RAS',11),(37,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',70,180,'RAS',45),(38,'PERIODIQUE','2024-06-01','Docteur','Superviseur',60,181,'RAS',23),(39,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',75,170,'RAS',14),(40,'PERIODIQUE','2024-06-01','Docteur','Superviseur',59,155,'RAS',43),(41,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',87,171,'RAS',31),(42,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',65,183,'RAS',19),(43,'PERIODIQUE','2024-06-01','Docteur','Superviseur',61,163,'RAS',17),(44,'PERIODIQUE','2024-06-01','Docteur','Superviseur',73,168,'RAS',39),(45,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',58,160,'RAS',36),(46,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',95,171,'RAS',10),(47,'PERIODIQUE','2024-06-01','Docteur','Agent qualit├⌐',59,164,'RAS',33),(48,'PERIODIQUE','2024-06-01','Docteur','Technicien',82,163,'RAS',42),(49,'PERIODIQUE','2024-06-01','Docteur','Op├⌐rateur',70,161,'RAS',21),(50,'PERIODIQUE','2024-06-01','Docteur','Superviseur',65,166,'RAS',5);
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
INSERT INTO `medical_ficheaptitude` VALUES (1,'LEONI','Zone Industrielle Menzel Hayet, Monastir','Fabrication de c├óblage automobile','CNSS-LEONI-45872','Ayadi Mahdi','15/04/1998 - Monastir','Rue Habib Bourguiba, Menzel Hayet, Monastir','CNSS-TRAV-2026-00125','Technicien en maintenance industrielle','2026-03-01','Technicien maintenance ligne de production','EMBAUCHE','APTE','Apte au poste de technicien maintenance.\nPort obligatoire des EPI.\nSurveillance m├⌐dicale p├⌐riodique recommand├⌐e.\n├ëviter le port de charges lourdes de mani├¿re prolong├⌐e.','2026-03-08','2026-03-08 09:52:06.222357',25,3),(2,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-08','2026-03-08 09:52:35.937161',25,3),(3,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-09','2026-03-09 08:50:29.379239',25,3),(4,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-09','2026-03-09 09:13:13.683344',25,3),(5,'LEONI','','','','Ayadi Mahdi','','','','',NULL,'','EMBAUCHE','APTE','','2026-03-09','2026-03-09 09:13:27.562558',25,3);
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_fichemedicale`
--

LOCK TABLES `medical_fichemedicale` WRITE;
/*!40000 ALTER TABLE `medical_fichemedicale` DISABLE KEYS */;
INSERT INTO `medical_fichemedicale` VALUES (1,'1990-03-12','sousse','sousse MSAKEN','54041532','2026-03-05 01:33:56.991900','2026-03-10 10:19:37.894611',25),(2,'1985-02-02','Nabeul','Avenue Habib Bourguiba','27518673','2026-03-05 03:25:33.267431','2026-03-17 11:32:39.509436',6),(3,'1965-01-04','Monastir','Quartier El Wafa','26162206','2026-03-06 01:40:59.591586','2026-03-17 11:32:39.952117',28),(4,'1979-09-10','Nabeul','Rue 01, Zone industrielle','29670650','2026-03-17 11:29:30.368744','2026-03-17 11:32:39.398345',1),(5,'1977-07-20','Sousse','Rue 01, Zone industrielle','26617709','2026-03-17 11:29:30.381288','2026-03-17 11:32:39.418402',2),(6,'1988-02-21','Monastir','Rue 01, Zone industrielle','26101643','2026-03-17 11:29:30.392816','2026-03-17 11:32:39.435444',3),(7,'1961-08-07','Sousse','Avenue Habib Bourguiba','27457318','2026-03-17 11:29:30.402347','2026-03-17 11:32:39.461118',4),(8,'1988-10-26','Sfax','R├⌐sidence El Amal','23620781','2026-03-17 11:29:30.413424','2026-03-17 11:32:39.487231',5),(9,'1988-11-18','Sousse','Avenue Habib Bourguiba','26110003','2026-03-17 11:29:30.436004','2026-03-17 11:32:39.528531',7),(10,'1974-12-23','Sfax','Avenue Habib Bourguiba','23112970','2026-03-17 11:29:30.445523','2026-03-17 11:32:39.549107',8),(11,'1974-04-01','Sousse','R├⌐sidence El Amal','21397916','2026-03-17 11:29:30.457067','2026-03-17 11:32:39.570168',9),(12,'1988-03-12','Sfax','R├⌐sidence El Amal','25260908','2026-03-17 11:29:30.465575','2026-03-17 11:32:39.590226',10),(13,'1967-06-07','Sousse','Rue 01, Zone industrielle','21592474','2026-03-17 11:29:30.477102','2026-03-17 11:32:39.609284',11),(14,'1995-11-21','Sousse','Avenue Habib Bourguiba','25406769','2026-03-17 11:29:30.487628','2026-03-17 11:32:39.626337',12),(15,'1965-12-12','Monastir','R├⌐sidence El Amal','22404595','2026-03-17 11:29:30.499170','2026-03-17 11:32:39.646928',13),(16,'1996-08-29','Tunis','Avenue Habib Bourguiba','23017569','2026-03-17 11:29:30.509697','2026-03-17 11:32:39.666970',14),(17,'1975-09-20','Monastir','R├⌐sidence El Amal','28188599','2026-03-17 11:29:30.520224','2026-03-17 11:32:39.691037',15),(18,'1961-05-23','Sfax','Quartier El Wafa','22430404','2026-03-17 11:29:30.528752','2026-03-17 11:32:39.712116',16),(19,'2003-03-27','Sfax','Avenue Habib Bourguiba','28384245','2026-03-17 11:29:30.540293','2026-03-17 11:32:39.730183',17),(20,'1978-11-02','Sousse','R├⌐sidence El Amal','26267475','2026-03-17 11:29:30.553809','2026-03-17 11:32:39.749870',18),(21,'1970-06-28','Sfax','R├⌐sidence El Amal','28734422','2026-03-17 11:29:30.564335','2026-03-17 11:32:39.769089',19),(22,'1969-08-22','Sousse','Quartier El Wafa','26056984','2026-03-17 11:29:30.573856','2026-03-17 11:32:39.791198',20),(23,'1970-02-08','Monastir','Rue 01, Zone industrielle','22953764','2026-03-17 11:29:30.585392','2026-03-17 11:32:39.811339',21),(24,'1986-07-17','Sousse','R├⌐sidence El Amal','28246729','2026-03-17 11:29:30.593914','2026-03-17 11:32:39.830421',22),(25,'1964-08-23','Sousse','Avenue Habib Bourguiba','26066279','2026-03-17 11:29:30.616024','2026-03-17 11:32:39.859537',23),(26,'1963-09-06','Nabeul','R├⌐sidence El Amal','26023180','2026-03-17 11:29:30.629563','2026-03-17 11:32:39.879623',24),(27,'1994-10-03','Monastir','Rue 01, Zone industrielle','24246358','2026-03-17 11:29:30.648607','2026-03-17 11:32:39.914324',26),(28,'1970-09-04','Monastir','R├⌐sidence El Amal','27172395','2026-03-17 11:29:30.658126','2026-03-17 11:32:39.932997',27),(29,'2001-05-22','Sousse','Quartier El Wafa','24001559','2026-03-17 11:29:30.676189','2026-03-17 11:32:39.972169',29),(30,'1961-05-07','Sfax','R├⌐sidence El Amal','25731270','2026-03-17 11:29:30.685714','2026-03-17 11:32:39.991214',30),(31,'1994-05-15','Nabeul','Quartier El Wafa','26542997','2026-03-17 11:29:30.699265','2026-03-17 11:32:40.009275',31),(32,'1990-11-25','Sousse','Rue 01, Zone industrielle','28731207','2026-03-17 11:29:30.713845','2026-03-17 11:32:40.028325',32),(33,'1994-08-14','Monastir','Quartier El Wafa','29496668','2026-03-17 11:29:30.726919','2026-03-17 11:32:40.045923',33),(34,'1983-06-05','Sfax','Avenue Habib Bourguiba','27896831','2026-03-17 11:29:30.738450','2026-03-17 11:32:40.063472',34),(35,'1976-09-15','Nabeul','R├⌐sidence El Amal','22718630','2026-03-17 11:29:30.751977','2026-03-17 11:32:40.079527',35),(36,'1979-08-12','Sousse','Quartier El Wafa','22527776','2026-03-17 11:29:30.763517','2026-03-17 11:32:40.097567',36),(37,'1976-08-11','Nabeul','Rue 01, Zone industrielle','27185121','2026-03-17 11:29:30.774032','2026-03-17 11:32:40.129751',37),(38,'1998-11-06','Nabeul','R├⌐sidence El Amal','22722630','2026-03-17 11:29:30.783550','2026-03-17 11:32:40.158008',38),(39,'1978-02-13','Monastir','Avenue Habib Bourguiba','25316178','2026-03-17 11:29:30.794082','2026-03-17 11:32:40.189539',39),(40,'1963-02-12','Nabeul','R├⌐sidence El Amal','22803859','2026-03-17 11:29:30.803616','2026-03-17 11:32:40.218166',40),(41,'1966-11-28','Sfax','Rue 01, Zone industrielle','25351374','2026-03-17 11:29:30.817183','2026-03-17 11:32:40.249327',41),(42,'1965-11-10','Sfax','Rue 01, Zone industrielle','28297308','2026-03-17 11:29:30.827718','2026-03-17 11:32:40.271475',42),(43,'1978-01-10','Tunis','Rue 01, Zone industrielle','27049207','2026-03-17 11:29:30.839242','2026-03-17 11:32:40.293533',43),(44,'1964-06-28','Sousse','Rue 01, Zone industrielle','23026753','2026-03-17 11:29:30.848779','2026-03-17 11:32:40.317673',44),(45,'1966-04-18','Sfax','Avenue Habib Bourguiba','22317693','2026-03-17 11:29:30.859309','2026-03-17 11:32:40.366326',45),(46,'1990-04-18','Monastir','Rue 01, Zone industrielle','27389998','2026-03-17 11:29:30.872831','2026-03-17 11:32:40.424523',46),(47,'1993-02-10','Tunis','Quartier El Wafa','25978583','2026-03-17 11:29:30.883441','2026-03-17 11:32:40.485623',47),(48,'2004-04-19','Sfax','Avenue Habib Bourguiba','25557025','2026-03-17 11:29:30.893965','2026-03-17 11:32:40.538417',48),(49,'1960-11-13','Nabeul','Avenue Habib Bourguiba','27889526','2026-03-17 11:29:30.905530','2026-03-17 11:32:40.587803',49),(50,'1998-05-16','Tunis','Quartier El Wafa','22764631','2026-03-17 11:29:30.916053','2026-03-17 11:32:40.632531',50);
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
  `cause` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_bon` date DEFAULT NULL,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lesion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_assurance` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_incident` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
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
INSERT INTO `medical_incidentinfirmier` VALUES (1,'2026-02-02','09:00:00.000000','Neo','MH1','Operatrice','traumatisme','contact','54041531','rabeb','physiol+coner gel','2026-03-06 20:41:56.477906',12,NULL,NULL,NULL,NULL,NULL,'SANS_BON');
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
  `arret_travail` tinyint(1) NOT NULL,
  `date_arret` date DEFAULT NULL,
  `date_arret_exposition` date DEFAULT NULL,
  `date_constat` date DEFAULT NULL,
  `employeur_activite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_cnss` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_code_postal` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_nom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeur_telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medecin_constat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nature_travail` longtext COLLATE utf8mb4_unicode_ci,
  `salaire_duree` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaire_maintenu` tinyint(1) NOT NULL,
  `salaire_montant` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaire_unite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signataire_nom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signataire_qualite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_date` date DEFAULT NULL,
  `signature_lieu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `travaux_anterieurs` json DEFAULT NULL,
  `victime_adresse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_cin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_cnss` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_code_postal` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_date_embauche` date DEFAULT NULL,
  `victime_date_naissance` date DEFAULT NULL,
  `victime_lieu_naissance` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_lieu_travail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_nationalite` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_nom` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_nom_naissance` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_prenom` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_prenom_pere` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_profession` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_sexe` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_situation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `victime_specialite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_maladieprofe_dossier_id_3e3f9980_fk_medical_d` (`dossier_id`),
  CONSTRAINT `medical_maladieprofe_dossier_id_3e3f9980_fk_medical_d` FOREIGN KEY (`dossier_id`) REFERENCES `medical_dossiermedical` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_maladieprofessionnelle`
--

LOCK TABLES `medical_maladieprofessionnelle` WRITE;
/*!40000 ALTER TABLE `medical_maladieprofessionnelle` DISABLE KEYS */;
INSERT INTO `medical_maladieprofessionnelle` VALUES (1,'Dermatite de contact','Solvant','12','2026-03-15',NULL,NULL,44,1,'2026-03-18','2026-03-18','2026-03-16',NULL,'Zone Industrielle',NULL,NULL,'LEONI',NULL,'Dr Test','Assemblage c?blage','10',1,'500','TND','Responsable RH','RH','2026-03-20','Monastir','[{\"date_fin\": \"2024-12-31\", \"materiaux\": \"Solvants\", \"date_debut\": \"2023-01-01\", \"entreprise\": \"Ancienne Soci?t?\", \"nature_travail\": \"Peinture\"}]','Rue 01, Zone industrielle','34917781',NULL,NULL,NULL,'1979-09-10',NULL,NULL,NULL,'Masmoudi',NULL,'Rania',NULL,NULL,NULL,NULL,NULL),(2,'Dermatite de contact','Solvant','12','2026-03-15',NULL,NULL,44,1,'2026-03-18','2026-03-18','2026-03-16',NULL,'Zone Industrielle',NULL,NULL,'LEONI',NULL,'Dr Test','Assemblage c?blage','10',1,'500','TND','Responsable RH','RH','2026-03-20','Monastir','[{\"date_fin\": \"2024-12-31\", \"materiaux\": \"Solvants\", \"date_debut\": \"2023-01-01\", \"entreprise\": \"Ancienne Soci?t?\", \"nature_travail\": \"Peinture\"}]','Rue 01, Zone industrielle','34917781',NULL,NULL,NULL,'1979-09-10',NULL,NULL,NULL,'Masmoudi',NULL,'Rania',NULL,NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_ordonnance`
--

LOCK TABLES `medical_ordonnance` WRITE;
/*!40000 ALTER TABLE `medical_ordonnance` DISABLE KEYS */;
INSERT INTO `medical_ordonnance` VALUES (1,'2026-03-05','PARACETAMOL','2026-03-05 03:24:45.018484',25,2),(2,'2026-03-12','doliprane','2026-03-12 14:51:51.664706',16,8);
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_postetravail`
--

LOCK TABLES `medical_postetravail` WRITE;
/*!40000 ALTER TABLE `medical_postetravail` DISABLE KEYS */;
INSERT INTO `medical_postetravail` VALUES (1,'2020-01-01',NULL,'Op├⌐rateur','Faible',44),(2,'2020-01-01',NULL,'Superviseur','Faible',49),(3,'2020-01-01',NULL,'Technicien','Faible',41),(4,'2020-01-01',NULL,'Superviseur','Faible',22),(5,'2020-01-01',NULL,'Superviseur','Faible',8),(6,'2020-01-01',NULL,'Op├⌐rateur','Faible',4),(7,'2020-01-01',NULL,'Op├⌐rateur','Faible',2),(8,'2020-01-01',NULL,'Op├⌐rateur','Faible',46),(9,'2020-01-01',NULL,'Technicien','Faible',29),(10,'2020-01-01',NULL,'Op├⌐rateur','Faible',30),(11,'2020-01-01',NULL,'Agent qualit├⌐','Faible',18),(12,'2020-01-01',NULL,'Superviseur','Faible',20),(13,'2020-01-01',NULL,'Op├⌐rateur','Faible',38),(14,'2020-01-01',NULL,'Superviseur','Faible',32),(15,'2020-01-01',NULL,'Superviseur','Faible',34),(16,'2020-01-01',NULL,'Op├⌐rateur','Faible',9),(17,'2020-01-01',NULL,'Op├⌐rateur','Faible',25),(18,'2020-01-01',NULL,'Superviseur','Faible',26),(19,'2020-01-01',NULL,'Agent qualit├⌐','Faible',37),(20,'2020-01-01',NULL,'Superviseur','Faible',50),(21,'2020-01-01',NULL,'Agent qualit├⌐','Faible',16),(22,'2020-01-01',NULL,'Technicien','Faible',48),(23,'2020-01-01',NULL,'Agent qualit├⌐','Faible',24),(24,'2020-01-01',NULL,'Superviseur','Faible',15),(25,'2020-01-01',NULL,'Superviseur','Faible',1),(26,'2020-01-01',NULL,'Op├⌐rateur','Faible',3),(27,'2020-01-01',NULL,'Technicien','Faible',47),(28,'2020-01-01',NULL,'Technicien','Faible',6),(29,'2020-01-01',NULL,'Technicien','Faible',27),(30,'2020-01-01',NULL,'Superviseur','Faible',40),(31,'2020-01-01',NULL,'Agent qualit├⌐','Faible',35),(32,'2020-01-01',NULL,'Technicien','Faible',28),(33,'2020-01-01',NULL,'Op├⌐rateur','Faible',12),(34,'2020-01-01',NULL,'Op├⌐rateur','Faible',13),(35,'2020-01-01',NULL,'Superviseur','Faible',7),(36,'2020-01-01',NULL,'Technicien','Faible',11),(37,'2020-01-01',NULL,'Agent qualit├⌐','Faible',45),(38,'2020-01-01',NULL,'Superviseur','Faible',23),(39,'2020-01-01',NULL,'Agent qualit├⌐','Faible',14),(40,'2020-01-01',NULL,'Superviseur','Faible',43),(41,'2020-01-01',NULL,'Op├⌐rateur','Faible',31),(42,'2020-01-01',NULL,'Agent qualit├⌐','Faible',19),(43,'2020-01-01',NULL,'Superviseur','Faible',17),(44,'2020-01-01',NULL,'Superviseur','Faible',39),(45,'2020-01-01',NULL,'Op├⌐rateur','Faible',36),(46,'2020-01-01',NULL,'Op├⌐rateur','Faible',10),(47,'2020-01-01',NULL,'Agent qualit├⌐','Faible',33),(48,'2020-01-01',NULL,'Technicien','Faible',42),(49,'2020-01-01',NULL,'Op├⌐rateur','Faible',21),(50,'2020-01-01',NULL,'Superviseur','Faible',5);
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_stockitem`
--

LOCK TABLES `medical_stockitem` WRITE;
/*!40000 ALTER TABLE `medical_stockitem` DISABLE KEYS */;
INSERT INTO `medical_stockitem` VALUES (1,'Parac├⌐tamol 500mg','MEDICAMENT',18,10,'bo├«tes','2026-03-06 06:20:23.702865'),(2,'B├⌐tadine','MEDICAMENT',16,5,'flacons','2026-03-06 06:20:23.719222'),(3,'Compresses st├⌐riles','CONSOMMABLE',12,15,'paquets','2026-03-06 06:20:23.727784'),(4,'Aspirine 500mg','MEDICAMENT',9,5,'25','2026-03-06 06:56:07.611330'),(7,'Amoxicilline 500mg','MEDICAMENT',40,10,'bo├«tes','2026-03-06 07:03:16.222655'),(8,'Panadol','MEDICAMENT',50,10,'bo├«tes','2026-03-06 07:04:23.311205'),(9,'Doliprane 1000mg','MEDICAMENT',60,10,'bo├«tes','2026-03-06 07:04:59.911481'),(10,'Compresses st├⌐riles','CONSOMMABLE',30,10,'paquets','2026-03-06 07:05:54.097624'),(11,'tanganil','MEDICAMENT',18,5,'bo├«tes','2026-03-10 10:22:39.751738');
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_vaccination`
--

LOCK TABLES `medical_vaccination` WRITE;
/*!40000 ALTER TABLE `medical_vaccination` DISABLE KEYS */;
INSERT INTO `medical_vaccination` VALUES (1,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,44),(2,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,49),(3,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,41),(4,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,22),(5,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,8),(6,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,4),(7,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,2),(8,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,46),(9,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,29),(10,'Grippe','2024-01-01',NULL,NULL,NULL,30),(11,'Grippe','2024-01-01',NULL,NULL,NULL,18),(12,'Grippe','2024-01-01',NULL,NULL,NULL,20),(13,'Grippe','2024-01-01',NULL,NULL,NULL,38),(14,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,32),(15,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,34),(16,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,9),(17,'Grippe','2024-01-01',NULL,NULL,NULL,25),(18,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,26),(19,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,37),(20,'Grippe','2024-01-01',NULL,NULL,NULL,50),(21,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,16),(22,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,48),(23,'Grippe','2024-01-01',NULL,NULL,NULL,24),(24,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,15),(25,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,1),(26,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,3),(27,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,47),(28,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,6),(29,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,27),(30,'Grippe','2024-01-01',NULL,NULL,NULL,40),(31,'Grippe','2024-01-01',NULL,NULL,NULL,35),(32,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,28),(33,'Grippe','2024-01-01',NULL,NULL,NULL,12),(34,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,13),(35,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,7),(36,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,11),(37,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,45),(38,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,23),(39,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,14),(40,'Grippe','2024-01-01',NULL,NULL,NULL,43),(41,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,31),(42,'Grippe','2024-01-01',NULL,NULL,NULL,19),(43,'H├⌐patite B','2024-01-01',NULL,NULL,NULL,17),(44,'Grippe','2024-01-01',NULL,NULL,NULL,39),(45,'Grippe','2024-01-01',NULL,NULL,NULL,36),(46,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,10),(47,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,33),(48,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,42),(49,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,21),(50,'T├⌐tanos','2024-01-01',NULL,NULL,NULL,5);
/*!40000 ALTER TABLE `medical_vaccination` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications_notification`
--

DROP TABLE IF EXISTS `notifications_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications_notification` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notification_user_id_b5e8c0ff_fk_accounts_user_id` (`user_id`),
  CONSTRAINT `notifications_notification_user_id_b5e8c0ff_fk_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications_notification`
--

LOCK TABLES `notifications_notification` WRITE;
/*!40000 ALTER TABLE `notifications_notification` DISABLE KEYS */;
INSERT INTO `notifications_notification` VALUES (1,'Nouveau rendez-vous','Omar Ben Ali (1056538206) - 17/03/2026 09:00',0,'2026-03-16 23:29:59.691765',9);
/*!40000 ALTER TABLE `notifications_notification` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-27 14:17:58
