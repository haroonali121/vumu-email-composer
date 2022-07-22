import "./EmailComposer.css";
import React from "react";
import Froala from 'froala-editor';
import 'froala-editor/js/plugins.pkgd.min';
import {useState, useEffect, useCallback} from "react";
import {Form, Input, Select, Button} from "antd";
import * as _ from 'lodash';


// Require Editor JS files.
import 'froala-editor/js/froala_editor.pkgd.min.js';

// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// Require Font Awesome.
import 'font-awesome/css/font-awesome.css';

import FroalaEditor from 'react-froala-wysiwyg';

// Import all Froala Editor plugins;
import 'froala-editor/js/plugins.pkgd.min.js';
import {recordingSvg, toolbarConfig} from "./helper";

interface ApiUrls {
  crm_api_url: string,
  ust_redirect_origin: string,
  ust_api_url: string,
  email_server_api_url: string
}

interface RecipientConfig {
  to: string[];
  cc: string[];
  bcc: string[]
}

interface ReplyTo {
  conversationId: string;
  subject: string;
}

export interface ComposerProps {
  action_type: string;
  editor_content: string;
  recipient_config: RecipientConfig;
  froala_key: string;
  api_url: ApiUrls;
  show_disable_banner: boolean,
  user_id: string;
  replyTo: ReplyTo | null;
  onRecordingCLick(): any
}

interface Options {
  label: string;
  value: string;
}

const MODES = {
  MINIMAL: 'minimal',
  FULL: 'full'
}

const EmailComposer = React.forwardRef((props: ComposerProps) => {
  const [form] = Form.useForm();
  const [emailBody, setEmailBody] = useState("");
  const [isDisplayCc, setIsDisplayCc] = useState(false);
  const [isDisplayBcc, setIsDisplayBcc] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [options, setOptions] = useState<Options[]>([]);
  const [ccOptions, setCcOptions] = useState<Options[]>([]);
  const [bccOptions, setBccOptions] = useState<Options[]>([]);
  const [formValidationError, setFormValidationError] = useState(false);
  const [initialFormData, setInitialFormData] = useState(props ? {emailTo: props.recipient_config.to, ccField: props.recipient_config.to, bccField: props.recipient_config.bcc}: {emailTo: [''], ccField: [''], bccField: [''] });

  // const data = { ...initialFormData, emailTo: props.recipient_config.to, ccField: props.recipient_config.cc, bccField: props.recipient_config.bcc };
  // setInitialFormData(data);

  const config = {
    placeholderText: !props.replyTo ? 'Edit Your Content Here!': '',
    charCounterCount: false,
    inlineMode: false,
    height: 240,
    // toolbarButtons: ['fontFamily', 'paragraphFormat', 'bold', 'italic', 'underline','alignLeft', 'alignCenter', 'alignRight', 'formatUL', 'insertLink'],
    toolbarButtons: toolbarConfig,
    imageUpload: true,
    imageManager: false,
    videoUpload: false,
    imageDefaultAlign: 'left',
    imageDefaultDisplay: 'inline-block',
    // Set max image size to 5MB.
    imageMaxSize: 5 * 1024 * 1024,
    // Allow to upload PNG and JPG.
    imageAllowedTypes: ['jpeg', 'jpg', 'png'],
    quickInsertTags: [''],
    key: props.froala_key
  }

  useEffect(()=>{
    Froala.DefineIconTemplate('customImage', '<img class="editor-custom-image" src=[SRC] alt=[ALT] />');
    Froala.DefineIconTemplate('customSVG', '[SVG]');

    setTimeout(()=>{
      Froala.DefineIcon('recordingIcon', {
        SVG: recordingSvg(),
        template: 'customSVG',
      });
      Froala.RegisterCommand('recordingIcon', {
        title: 'Start Recording',
        icon: 'recordingIcon',
        callback: () => {
          handleClickOnRecordVideo()
        },
    }, 2000)

    });
  }, [])

  useEffect(() => {
    setEmailBody(props.editor_content);

    if(props.recipient_config.cc.length > 0)
      showCcField();
    if(props.recipient_config.bcc.length > 0)
      showBccField();
  }, []);

  useEffect(() => {
    if(props.replyTo) {
      // if(props.replyTo.sendCallback)
      // props.replyTo.sendCallback(handleSubmitCallback);
      document.querySelector('#message-section').removeEventListener('submit', submitByEvent, false);
      document.querySelector('#message-section').addEventListener('submit', submitByEvent, false);

      setInitialFormData({ ...initialFormData, emailSubject: props.replyTo.subject });
    }
  }, [props.replyTo]);

  const submitByEvent = () => {
    console.log('sadfasdfasdfsafsdafdsfdsaa');
    form.submit();
  }

  useEffect(() => {
    if(props.recipient_config) {
      const data = { ...initialFormData, emailTo: props.recipient_config.to, ccField: props.recipient_config.cc, bccField: props.recipient_config.bcc };
      setInitialFormData(data);
    }
  }, [props.recipient_config]);
  const handleClickOnRecordVideo = () => {
    console.log('clicked on record Video')
    props.onRecordingCLick()
  }
  const showCcField = () => {
    setIsDisplayCc(true);
  };

  const showBccField = () => {
    setIsDisplayBcc(true);
  };

  const onFinish = (values: any) => {
    handleSubmit(values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };


  const handleSubmitCallback = () => {
    console.log('HELLO WORLD');
    form.submit();
  }

  const handleSubmit = async (values: any) => {
    const payload = {
      emailTo: values.emailTo,
      cc: values.ccField,
      bcc: values.bccField,
      subject: values.emailSubject,
      content: emailBody,
      userId: props.user_id,
      customerEmail: customerEmail,
    }

    if(props.replyTo) {
      payload.emailTo = props.recipient_config.to;
      payload.subject = props.replyTo.subject;
      payload.conversationId = props.replyTo.conversationId;
    }

    if(values.emailTo && values.emailTo.length) {
      setIsSendingEmail(true)

      fetch(props.api_url.email_server_api_url + "e/send-email", {
        "method": "POST",
        "headers": {
          "content-type": "application/json",
          "accept": "application/json"
        },
        "body": JSON.stringify(payload)
      })
        .then(res => {
          // return res.json();
          return res;
        })
        .then(res => {
          setIsSendingEmail(false)
          if (res) {
            form.resetFields();
            setEmailBody("");
            const widgetEvent = new CustomEvent('close-window-composer', {
              isReply: !!props.replyTo
            });
            window.dispatchEvent(widgetEvent);
          }
        })
        .catch(e => {
          setIsSendingEmail(false)
          console.log("Error: ", e)
        });
    } else {
      message.error('Please mention atleast one mailing address in `to` field.');
    }
  }

  const isEmail = (email: string) => {
    return /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/.test(email);
  }

  const validateMultipleEmail = (emailList: any) => {
    let status = true;
    if (emailList.length) {
      emailList.forEach((val: any) => {
        if ( isEmail(val) ) {
          console.log("Valid:", val);
        } else {
          status = false
        }
      })
      return status
    } else {
      return status
    }
  }

  const handleEmailInput = (value: any) => {
    handleEmailInputDebounce(value, 'email');
  }

  const handleCcEmailInput = (value: any) => {
    handleEmailInputDebounce(value, 'cc');
  }

  const handleBccEmailInput = (value: any) => {
    handleEmailInputDebounce(value, 'bcc');
  }

  const handleEmailInputDebounce = useCallback(
    _.debounce((value: any, field: any) => {

      value = value.toLowerCase()
      if(value !== '') {
        fetchList(value, field);
      }
    }, 500, {trailing: true}),
    []
  );

  const fetchList = async (value: any, field: any) => {
    fetch(props.api_url.crm_api_url + "contacts/search", {
      "method": "POST",
      "headers": {
        "content-type": "application/json",
        "accept": "application/json"
      },
      "body": JSON.stringify({
        createdBy: props.user_id,
        query: value,
      })
    })
      .then(res => res.json())
      .then(res => {
        let list = [];
        let unique = [];
        for (const contact of res) {
            for (const singleEmail of contact.email) {
              if (singleEmail.indexOf(value) !== -1 && unique.indexOf(singleEmail) === -1) {
                unique.push(singleEmail);
                list.push({ label: singleEmail, value: singleEmail})
              }
            }
        }

        if (field == 'email') {
          setOptions(list);
        } else if (field == 'cc') {
          setCcOptions(list);
        } else if (field == 'bcc') {
          setBccOptions(list);
        }

      })
      .catch(e => {
        console.log("Error: ", e)
      });
 }

  return (
    <div className="email-composer">
      { props.show_disable_banner && <div className="popupNotice">
        <p>You have not yet entered your Vumu Email address. You can not send an email until its set up. <a href={props.api_url.ust_redirect_origin + "/preferences"} target="_blank">Please click here</a></p>
      </div>
      }
      <Form
        layout="vertical"
        form={form}
        initialValues={initialFormData}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <div id="emailReceiver">
          <Form.Item
            name="emailTo"
            label="To"
            rules={[
              {
                required: true,
                message: 'Enter Email'
              },
              {
                validator(_, value) {
                  console.log('HELLO', value);
                  if(typeof value === 'string') {
                    value = [value];
                  }

                  if (!value || !value.length) {
                    setFormValidationError(true);
                    return Promise.resolve();
                  }
                  console.log(value);
                  let sta = validateMultipleEmail(value);

                  if (sta === false) {
                    setFormValidationError(true);
                    return Promise.reject(new Error('One of email is invalid'));
                  }
                  else {
                    setFormValidationError(false);
                    return Promise.resolve();
                  }
                },
              }
            ]}
          >
            {/* <Input placeholder="Enter receipents email with comma seperated" value={emailTo} onChange={e => setEmailTo(e.target.value)} /> onChange={setEmailTo} */}
            <Select
              mode="tags"
              tokenSeparators={[',']}
              style={{ width: '100%' }}
              placeholder="Enter receipents email with comma seperated"
              options={options}
              filterOption={false}
              onSearch={handleEmailInput}
              className="tagsDropdown"
              getPopupContainer={() => document.getElementById("emailReceiver")}
              // defaultValue={props.recipient_config.to}
              >
            </Select>
          </Form.Item>
        </div>
        {(!isDisplayCc || !isDisplayBcc) &&
          <div className="email-to-links link">
            {!isDisplayCc &&<span className="click-to {}" onClick={()=> showCcField()}>Cc</span>}
            &nbsp;
            {!isDisplayBcc &&<span className="click-to" onClick={()=> showBccField()}>Bcc</span>}
          </div>
        }

        {isDisplayCc &&
          <div id="ccField">
            <Form.Item
              name="ccField"
              label="Cc"
              rules={[
                {
                  validator(_, value) {
                    if (!value) {
                      setFormValidationError(true);
                      return Promise.resolve();
                    }
                    let sta = validateMultipleEmail(value);
                    if (sta === false) {
                      setFormValidationError(true);
                      return Promise.reject(new Error('One of email is invalid'));
                    }
                    else {
                      setFormValidationError(false);
                      return Promise.resolve();
                    }
                  },
                }
              ]}
            >
              {/* <Input placeholder="Enter Cc" /> */}
              <Select
                mode="tags"
                tokenSeparators={[',']}
                style={{ width: '100%' }}
                placeholder="Enter email with comma seperated"
                options={ccOptions}
                filterOption={false}
                onSearch={handleCcEmailInput}
                // defaultValue={props.recipient_config.cc}
                getPopupContainer={() => document.getElementById("ccField")}
                >
              </Select>
            </Form.Item>
          </div>
        }

        {isDisplayBcc &&
          <div id="bccField">
            <Form.Item
              name="bccField"
              label="Bcc"
              rules={[
                {
                  validator(_, value) {
                    if (!value) {
                      setFormValidationError(true);
                      return Promise.resolve();
                    }
                    let sta = validateMultipleEmail(value);
                    if (sta === false) {
                      setFormValidationError(true);
                      return Promise.reject(new Error('One of email is invalid'));
                    }
                    else {
                      setFormValidationError(false);
                      return Promise.resolve();
                    }
                  },
                }
              ]}
            >
              {/* <Input placeholder="Enter Bcc" /> */}
              <Select
                mode="tags"
                tokenSeparators={[',']}
                style={{ width: '100%' }}
                placeholder="Enter email with comma seperated"
                options={bccOptions}
                filterOption={false}
                onSearch={handleBccEmailInput}
                getPopupContainer={() => document.getElementById("bccField")}
                >
              </Select>
            </Form.Item>
          </div>
        }

        <Form.Item
          name="emailSubject"
          label="Subject"
        >
          <Input placeholder="Enter Subject" />
        </Form.Item>

        <div className="email-editor">
          <Form.Item
            name="emailBody"
          >
            <FroalaEditor
              tag='textarea'
              config={config}
              model={emailBody}
              onModelChange={setEmailBody}
            />
          </Form.Item>
        </div>

        <div className="d-flex justify-content-center mt-2 modal-footer">
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSendingEmail} disabled={props.show_disable_banner} className="mt-2 btn btnAlpha">
              Send via Email
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  )
});

export default EmailComposer;
