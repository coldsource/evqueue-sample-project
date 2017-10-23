<html>
<head>
	<title>Sample evQueue project</title>
	<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
	<script src="evQueue.js"></script>
<body>

	<h2>evQueue sample project</h2>
	
	How much time should we sleep <input id="time" /> (in seconds)
	<br /><button id="launch">Launch new instance</button>
	
	<br /><br />
	<h2>Instances status</h2>
	<div id="instances-status"></div>
	
	<script type="text/javascript">
		evq = new evQueue('/evqueue-api.php');
		evq.MonitorStatus(function(instances) {
			var el = $('#instances-status');
			el.empty();
			
			for(var i=0;i<instances.length;i++)
			{
				if(instances[i].status=='EXECUTING')
				{
					el.append("<div>Workflow instance "+instances[i].id+" is executing...</div>");
					el.append("<pre>"+instances[i].tail+"</pre>");
				}
				else
				{
					if(instances[i].errors==0)
						el.append("<div style='color:#00ff00;'>Deployment terminated OK</div>");
					else
						el.append("<div style='color:#ff0000;'>Deployment terminated with errors</div>");
				}
			}
		});
		
		$('#launch').click(function() {
			evq.ClearStatuses();
			
			var time = $('#time').val();
			evq.Launch('sleep',{time:time});
		});
		
		$(document).bind('evq-launch',function() {
			$('#launch').prop('disabled',true);
		});
		
		$(document).bind('evq-terminated',function() {
			$('#launch').prop('disabled',false);
		});
	</script>
</body>