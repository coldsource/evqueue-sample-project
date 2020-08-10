<?php
require_once 'evQueueProxy.php';

(new evQueueProxy('tcp://localhost:5000','admin','admin'))->Run();