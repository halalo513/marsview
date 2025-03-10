import { memo, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Layout, Menu, MenuProps, Button, Popover, Dropdown, Space, Flex } from 'antd';
import {
  ProjectOutlined,
  OneToOneOutlined,
  CaretDownFilled,
  DownOutlined,
  AppstoreOutlined,
  LoadingOutlined,
  PieChartOutlined,
  CloudOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { usePageStore } from '@/stores/pageStore';
import { message } from '@/utils/AntdGlobal';
import { updatePageData } from '@/api';
import Publish from './PublishPopover';
import styles from './index.module.less';

/**
 * 编辑器顶部组件
 */
const Header = memo(() => {
  const [isNav, setNav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [navKey, setNavKey] = useState(['projects']);
  const [pageFrom, setPageFrom] = useState('projects');
  const [avatar, setAvatar] = useState<string>();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const goHome = () => {
    setMode('edit');
    // 点击Logo返回最近操作的列表，对用户友好
    const isProject = /project\/\d+\/\w+/.test(location.pathname);
    const isPage = /editor\/\d+\/(edit|publishHistory)/.test(location.pathname);
    const isLib = /lib\/\d+/.test(location.pathname);
    const isTmpl = /editor\/\d+\/template/.test(location.pathname);
    if (isProject) navigate('/projects');
    if (isPage) navigate('/pages');
    if (isLib) navigate('/libs');
    if (isTmpl) navigate('/templates');
  };
  const {
    userInfo,
    page: { pageId, pageName, remark, is_public, is_edit, ...pageData },
    mode,
    setMode,
    updatePageState,
  } = usePageStore((state) => {
    return {
      userInfo: state.userInfo,
      page: state.page,
      mode: state.mode,
      setMode: state.setMode,
      updatePageState: state.updatePageState,
    };
  });
  // Tab切换项
  const items: MenuProps['items'] = [
    {
      label: '项目列表',
      key: 'projects',
      icon: <ProjectOutlined style={{ fontSize: 16 }} />,
    },
    {
      label: '页面列表',
      key: 'pages',
      icon: <OneToOneOutlined style={{ fontSize: 16 }} />,
    },
    {
      label: '组件库',
      key: 'libs',
      icon: <AppstoreOutlined style={{ fontSize: 16 }} />,
    },
    {
      label: '精选模板',
      key: 'templates',
      icon: <PieChartOutlined style={{ fontSize: 16 }} />,
    },
    // {
    //   label: '工作流',
    //   key: 'workflows',
    //   icon: <ApartmentOutlined style={{ fontSize: 16 }} />,
    // },
    {
      label: '图片云',
      key: 'cloud',
      icon: <CloudOutlined style={{ fontSize: 16 }} />,
    },
  ];

  useEffect(() => {
    if (['/projects', '/pages', '/libs', '/templates', '/workflows', '/cloud'].includes(location.pathname)) {
      setNav(true);
      setNavKey([location.pathname.slice(1)]);
    } else {
      setNav(false);
    }
    setPageFrom(location.pathname.slice(1));
  }, [location]);

  // 获取用户头像
  useEffect(() => {
    const [email, suffix] = userInfo.userName.split('@');
    if (suffix === 'qq.com') {
      setAvatar(`https://q2.qlogo.cn/headimg_dl?dst_uin=${email}&spec=640`);
    } else {
      setAvatar('');
    }
  }, [userInfo]);

  // Tab切换点击
  const handleTab: MenuProps['onClick'] = (e) => {
    navigate(`/${e.key}`);
  };

  // 操作
  const handleClick = async (name: string) => {
    if (name === 'save') {
      setLoading(true);
      const page_data = JSON.stringify({
        ...pageData,
        // 下面字段排除在page_data外
        stg_state: undefined,
        pre_state: undefined,
        prd_state: undefined,
        preview_img: undefined,
        variableData: {},
        formData: {},
        stg_publish_id: undefined,
        pre_publish_id: undefined,
        prd_publish_id: undefined,
        user_id: undefined, //页面创建者
      });
      try {
        await updatePageData({
          id: pageId,
          name: pageName,
          remark: remark,
          is_public: is_public ?? 1,
          is_edit: is_edit ?? 1,
          page_data,
        });
        updatePageState({ env: 'all' });
        setLoading(false);
        message.success('保存成功', 1);
      } catch (error) {
        setLoading(false);
      }
    } else if (name === 'preview') {
      setMode('preview');
    } else {
      message.info('敬请期待');
    }
  };
  // 退出预览模式
  const handleExitPreview = () => {
    setMode('edit');
  };
  function goToPath(path: string) {
    if (path === 'edit') {
      // 跳转编辑页面时，编辑器已经被销毁，导致page对象为空，此时从浏览器中获取页面ID参数
      navigate(`/editor/${id}/${path}`);
    } else {
      navigate(`/editor/${pageId}/${path}`);
    }
  }

  const pathItems: MenuProps['items'] = [
    {
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            goToPath('edit');
          }}
        >
          编辑器
        </a>
      ),
      key: 'edit',
    },
    {
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            goToPath('publishHistory');
          }}
        >
          发布记录
        </a>
      ),
      key: 'publishHistory',
    },
  ];

  const isEditPage = pageFrom === `editor/${id}/edit` || pageFrom === `editor/${id}/template`;
  const isPublishPage = pageFrom === `editor/${id}/publishHistory`;

  return (
    <>
      <Layout.Header className={styles.layoutHeader}>
        <div className={styles.logo} onClick={goHome}>
          <img src={`${import.meta.env.VITE_CDN_URL}/mars-logo.png`} width={42} />
          <span>Marsview</span>
        </div>
        {/* 首页 - 导航菜单 */}
        {isNav && (
          <div className={styles.menu}>
            <Menu onClick={handleTab} selectedKeys={navKey} mode="horizontal" items={items} />
          </div>
        )}

        {/* 编辑页面-操作按钮 */}
        {isEditPage && mode === 'edit' && (
          <div className={styles.iconAction}>
            {/* 源码 */}
            <a onClick={() => handleClick('edit')}>
              <div className={styles.iconBlock}>
                <img src="/imgs/code.png" alt="源码" />
                <span>源码</span>
              </div>
            </a>
            {/* 保存 */}
            <a onClick={() => handleClick('save')}>
              <div className={styles.iconBlock}>
                {loading ? <LoadingOutlined /> : <img src="/imgs/save.png" alt="保存" />}
                <span>保存</span>
              </div>
            </a>
            {/* 预览 */}
            <a onClick={() => handleClick('preview')}>
              <div className={styles.iconBlock}>
                <img src="/imgs/preview.png" alt="预览" />
                <span>预览</span>
              </div>
            </a>
          </div>
        )}

        {/* 用户信息&发布&发布记录 */}
        <div className={styles.user}>
          <Space>
            <Popover
              placement="bottom"
              content={
                <>
                  <img width={150} src={`https://imgcloud.cdn.bcebos.com/f35323e9a2625a85909cb6f02.png`} />
                  <p style={{ textAlign: 'center' }}>请备注：marsview</p>
                </>
              }
            >
              <Button type="text" onClick={() => window.open('http://docs.marsview.cc', '_blank')}>
                联系我
              </Button>
            </Popover>
            <Button type="text" onClick={() => window.open('http://docs.marsview.cc', '_blank')}>
              帮助文档
            </Button>
            {isEditPage && mode === 'edit' && (
              <>
                <Popover placement="bottom" content={<Publish />} trigger="click">
                  <Button type="primary">
                    发布
                    <CaretDownFilled />
                  </Button>
                </Popover>
              </>
            )}
          </Space>
          {/* 编辑和发布 */}
          {(isEditPage || isPublishPage) && mode === 'edit' && (
            <Dropdown menu={{ items: pathItems, selectable: true, defaultSelectedKeys: [...pageFrom.split('/').slice(-1)] }}>
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  {isEditPage ? '编辑' : '发布记录'}
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          )}
          {/* 预览模式 */}
          {mode === 'preview' && (
            <Button type="primary" onClick={handleExitPreview}>
              退出预览
            </Button>
          )}

          {/* 用户头像 */}
          <div className={styles.avatar}>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: `${userInfo?.userName}`,
                  },
                  {
                    key: 'logout',
                    label: '退出',
                  },
                ],
                onClick: (e) => {
                  if (e.key === 'logout') {
                    localStorage.clear();
                    navigate(`/login?callback=${window.location.href}`);
                  }
                },
                selectable: true,
              }}
            >
              <Flex align="center" style={{ height: 64 }}>
                <a type="link" onClick={(e) => e.preventDefault()} style={{ marginInline: 5 }}>
                  {`${userInfo?.userName.split('@')[0]}` || '开发者'}
                </a>
                {avatar && <img width={25} style={{ verticalAlign: 'sub', borderRadius: '50%' }} src={avatar} />}
                {/* <DownOutlined style={{ color: '#7d33ff' }} /> */}
              </Flex>
            </Dropdown>

            {/* github开源地址 */}
            {
              <a href="https://github.com/JackySoft/marsview" className={styles.githubCorner} aria-label="View source on GitHub">
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 250 250"
                  style={{ fill: '#7d33ff', color: '#fff', position: 'absolute', top: 0, border: 0, right: 0 }}
                  aria-hidden="true"
                >
                  <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
                  <path
                    d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
                    fill="currentColor"
                    style={{ transformOrigin: '130px 106px' }}
                    className={styles.octoArm}
                  />
                  <path
                    d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
                    fill="currentColor"
                    className={styles.octoBody}
                  />
                </svg>
              </a>
              // <a href="https://github.com/JackySoft/marsview" aria-label="github" target="_blank">
              //   <svg
              //     className={styles.github}
              //     viewBox="0 0 1024 1024"
              //     version="1.1"
              //     xmlns="http://www.w3.org/2000/svg"
              //     p-id="4250"
              //     width="20"
              //     height="20"
              //   >
              //     <path
              //       d="M512 12.64c-282.752 0-512 229.216-512 512 0 226.208 146.72 418.144 350.144 485.824 25.6 4.736 35.008-11.104 35.008-24.64 0-12.192-0.48-52.544-0.704-95.328-142.464 30.976-172.512-60.416-172.512-60.416-23.296-59.168-56.832-74.912-56.832-74.912-46.464-31.776 3.52-31.136 3.52-31.136 51.392 3.616 78.464 52.768 78.464 52.768 45.664 78.272 119.776 55.648 148.992 42.56 4.576-33.088 17.856-55.68 32.512-68.48-113.728-12.928-233.28-56.864-233.28-253.024 0-55.904 20-101.568 52.768-137.44-5.312-12.896-22.848-64.96 4.96-135.488 0 0 43.008-13.76 140.832 52.48 40.832-11.36 84.64-17.024 128.16-17.248 43.488 0.192 87.328 5.888 128.256 17.248 97.728-66.24 140.64-52.48 140.64-52.48 27.872 70.528 10.336 122.592 5.024 135.488 32.832 35.84 52.704 81.536 52.704 137.44 0 196.64-119.776 239.936-233.792 252.64 18.368 15.904 34.72 47.04 34.72 94.816 0 68.512-0.608 123.648-0.608 140.512 0 13.632 9.216 29.6 35.168 24.576 203.328-67.776 349.856-259.616 349.856-485.76 0-282.784-229.248-512-512-512z"
              //       fill="#2c2c2c"
              //       p-id="4251"
              //     ></path>
              //   </svg>
              // </a>
            }
          </div>
        </div>
      </Layout.Header>
    </>
  );
});

export default Header;
