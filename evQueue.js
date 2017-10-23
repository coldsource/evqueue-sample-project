function evQueue(proxy_url)
{
	this.proxy_url = proxy_url;
	this.monitor_cbk = false;
	this.monitor_timeout = false;
	
}

evQueue.prototype.API = function(options) {
	options = $.extend({confirm: '', attributes: [], parameters: []}, options);
	
	var promise = new jQuery.Deferred();
	
	$.ajax({
		url: this.proxy_url,
		type: 'post',
		data: {
			group: options.group,
			action: options.action,
			attributes: options.attributes,
			parameters: options.parameters,
			node: options.node,
		},
	}).done(function(xml){
		error = $(xml).children('error');
		if ($(error).length > 0) {
			if(!options.ignore_errors)
				alert(error.html());
			promise.reject();
			return;
		}
		
		xml.Query = function(xpath, context = false)
		{
			if(context===false)
				context = this.documentElement;
			
			var results = this.evaluate(xpath,context,null,XPathResult.ANY_TYPE, null);
			var ret = [];
			while (result = results.iterateNext())
				ret.push(result);
			return ret;
		}
		
		promise.resolve(xml);
	});
	
	return promise;
}

evQueue.prototype.Launch = function(name, paramters = {})
{
	var evq = this;
	
	$(document).trigger('evq-launch');
	
	this.API({group:'instance',action:'launch',attributes:{name:name},parameters:paramters}).done(function(xml) {
		var id = xml.documentElement.getAttribute('workflow-instance-id');
		
		var instances = sessionStorage.getItem('evq-instances');
		if(instances===null)
			instances = [];
		else
			instances = JSON.parse(instances);
		
		instances.push({id:id,status:'UNKNOWN'});
		sessionStorage.setItem('evq-instances',JSON.stringify(instances));
		
		if(evq.monitor_cbk!==false)
		{
			if(evq.monitor_timeout!==false)
				clearTimeout(evq.monitor_timeout);
			
			evq.MonitorStatus(evq.monitor_cbk);
		}
	});
}

evQueue.prototype.GetStatus = function(id)
{
	var promise = new jQuery.Deferred();
	var evq = this;
	
	evq.API({group:'instance',action:'query',attributes:{id:id}}).fail(function() {
		promise.reject();
	}).done(function(xml) {
		promise.id = id;
		promise.status = xml.documentElement.firstChild.getAttribute('status');
		promise.errors = xml.documentElement.firstChild.getAttribute('errors');
		
		var running_tasks = xml.Query('//task[@status="EXECUTING"]');
		if(running_tasks.length>0)
		{
			var running_task = running_tasks[0];
			var tid = running_task.getAttribute('tid');
			
			evq.API({group:'processmanager',action:'tail',attributes:{tid:tid,type:'stdout'}}).done(function(xml) {
				promise.tail = xml.documentElement.textContent;
				
				promise.resolve();
			});
		}
		else
			promise.resolve();
	});
	
	return promise;
}


evQueue.prototype.MonitorStatus = function(cbk)
{
	var evq = this;
	this.monitor_cbk = cbk;
	
	evq.monitor_timeout = false;
	
	var promises = [];
	
	var instances = sessionStorage.getItem('evq-instances');
	if(instances===null)
		instances = [];
	else
		instances = JSON.parse(instances);
	
	for(var i=0;i<instances.length;i++)
	{
		if(instances[i].status=='EXECUTING' || instances[i].status=='UNKNOWN')
		{
			var promise = evq.GetStatus(instances[i].id);
			promise.idx = i;
			promises.push(promise);
		}
	}
	
	$.when.apply($,promises).done(function() {
		var instances_status = [];
		var has_executing = false;
		for(var i=0;i<promises.length;i++)
		{
			if(instances[promises[i].idx].status=='EXECUTING' && promises[i].status!='EXECUTING')
				$(document).trigger('evq-terminated',promises[i].id);
			
			instances[promises[i].idx].status = promises[i].status;
			instances[promises[i].idx].errors = promises[i].errors;
			instances[promises[i].idx].tail = promises[i].tail;
			
			if(promises[i].status=='EXECUTING')
				has_executing = true;
		}
		
		sessionStorage.setItem('evq-instances',JSON.stringify(instances));
		cbk(instances);
		
		if(has_executing)
			evq.monitor_timeout = setTimeout(function() { evq.MonitorStatus(cbk); }, 2000);
	});
}

evQueue.prototype.ClearStatuses = function()
{
	if(this.monitor_timeout!==false)
		clearTimeout(this.monitor_timeout);
	
	sessionStorage.removeItem('evq-instances');
	
	if(this.monitor_cbk!==false)
		this.MonitorStatus(this.monitor_cbk);
}